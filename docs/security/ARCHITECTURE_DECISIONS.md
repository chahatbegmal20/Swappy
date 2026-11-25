# Architecture Decision Records — Authentication & Origin Topology

**Status:** Proposed for approval (no further app-code changes until signed off)  
**Branch:** `security/phase-1-hardening`  
**Date:** 2026-11-25  

---

## Context: cross-origin today

| Tier | Host | Typical origin |
|------|------|----------------|
| Frontend | Vercel | `https://www.swappystudio.com` |
| API | AWS ECS Express | Separate `https://….amazonaws.com` (or custom API host) |

The browser calls the API via `NEXT_PUBLIC_API_URL` (`apps/web/src/lib/api.ts`). That is **cross-origin**. With cookies this becomes **cross-site** unless both share a registrable domain (e.g. `www` + `api.swappystudio.com`) **and** cookie `Domain` / `SameSite` are set carefully.

**Preferred direction (product owner):** browser talks only to the **frontend origin**; Next.js (or a reverse proxy) forwards `/api/*` to ECS. Large uploads and long AI jobs must **not** blindly traverse that proxy.

---

## ADR-001 — Session model (A vs B vs C)

### Option A — Stateless JWT (current)

**What exists:** API mints HS256 JWT (`sub` = user id, ~24h). OAuth puts JWT in URL query; client stores `localStorage.swappy_token`; requests send `Authorization: Bearer`.

| Criterion | Assessment |
|-----------|------------|
| Security | Weak vs XSS (JS-readable token); URL leak (C1) |
| Persistence | Survives API restart; no server session row |
| Immediate revocation | **No** (wait for expiry) |
| Multi-device | Implicit (many JWTs valid) |
| ECS scaling | Excellent (no sticky session) |
| MongoDB | Not required for sessions |
| Redis | Not required |
| Cross-origin | Bearer works easily; cookies harder |
| CSRF | Low risk while Bearer-from-JS (custom header) |
| Long AI / streaming | Unaffected (token on each request) |
| Migration cost | Baseline |
| Cost | Lowest |

### Option B — Short-lived JWT + refresh rotation

Access JWT minutes-long; refresh token rotated/revocable in a store.

| Criterion | Assessment |
|-----------|------------|
| Security | Better than A if refresh is HttpOnly; access still Bearer-XSSable if in JS |
| Revocation | Refresh family can be revoked; access until TTL |
| Scaling | Needs shared store for refresh (Mongo or Redis) |
| Complexity | Medium–high (rotation, reuse detection) |
| Cross-origin | Same cookie issues as C if refresh is cookie-based |

### Option C — Opaque server-side sessions + HttpOnly cookie (**preferred**)

Browser holds opaque session id in **HttpOnly; Secure; SameSite** cookie. Server looks up session in **MongoDB** (`sessions` collection). Logout deletes the row → immediate revocation.

| Criterion | Assessment |
|-----------|------------|
| Security | Best against XSS token theft; CSRF must be designed |
| Persistence | Explicit TTL / sliding expiry in Mongo |
| Immediate revocation | **Yes** |
| Multi-device | List/revoke sessions by `user_id` |
| ECS scaling | Stateless app tier; Mongo is shared source of truth |
| MongoDB | **Required** (already primary DB) |
| Redis | **Not required** — do not introduce Redis only because `REDIS_URL` exists |
| Cross-origin | **Hard** without same-site/same-origin strategy (see ADR-002) |
| CSRF | Required for cookie auth (SameSite=Lax + Origin check and/or CSRF token) |
| Streaming / AI | Cookie sent automatically on same-origin proxy paths; still avoid proxying huge bodies |
| Migration | Medium — dual-read Bearer\|cookie during transition |
| Cost | Mongo storage negligible vs new Redis service |

### Decision (pending your approval)

**Adopt Option C** with MongoDB session documents, contingent on **ADR-002** (same-origin browser API).  

**Reject** URL fragments as a permanent credential channel.  
**Reject** introducing Redis for sessions unless a separate, measured need appears (Celery worker is unused by live API routers today).

### Why not Redis “because REDIS_URL exists”

Revalidation: `REDIS_URL` appears in `apps/api/core/config.py` and `apps/worker/tasks.py` (Celery broker). **No API router imports Redis.** Provisioning is **unverified** in AWS. Adding Redis now increases cost and failure modes without benefit for Option C.

---

## ADR-002 — Same-origin API façade (Vercel → ECS)

### Goal

Browser origin: `https://www.swappystudio.com`  
Browser calls: `https://www.swappystudio.com/api/v1/...`  
Vercel rewrites/proxies to ECS: `https://<ecs-api>/api/v1/...`

Cookies then become **same-site / same-origin** relative to the page → HttpOnly sessions practical.

### Vercel limits (verified against current Vercel docs, Nov 2026)

| Constraint | Limit | Implication for Swappy |
|------------|-------|-------------------------|
| External rewrite / proxied request timeout | **120s** to first byte; then need data every ≤120s | Score/analyze if >2 min to first byte will fail through rewrite |
| Serverless function max duration | Default **300s**; Pro up to **800s** (extended beta higher) | Applies to **Route Handlers / functions**, not the same as CDN external rewrite path |
| Request body to Functions | Default **4.5 MB**; 20 MiB beta with fluid compute + 4GB | **Must not** proxy video uploads through Next |
| Response body | 4.5 MB unless streamed | Large downloads should use signed URLs |

**Conclusion:** Same-origin proxy is appropriate for **JSON auth, CRUD, trend GETs, short analyzes**. It is **inappropriate** as the byte path for large media or unbounded AI jobs.

### Upload pattern (required)

1. Authenticated `POST /uploads/presign` (via same-origin façade)  
2. Browser **PUT directly to S3/R2** using signed URL (cross-origin to storage is fine)  
3. Authenticated `POST /uploads/complete`  
4. Scoring reads from object storage asynchronously (future worker) — do not stream whole files through Vercel

### Long-running AI pattern (required)

Prefer: `POST /scoring/analyze` returns quickly with job id **or** ensure TTFB < 120s if kept sync behind rewrite.  
If sync analyze stays heavy: call ECS **directly** with cookie-incompatible Bearer **only for that job** is worse — better: async job + poll over same-origin, or stream progress bytes within 120s heartbeat rules.

### Implementation sketch (after approval)

```text
apps/web/vercel.json  →  rewrites: [{ "source": "/api/:path*", "destination": "https://ECS/api/:path*" }]
```
Or Next.js Route Handlers as explicit BFF for auth cookie translation only.

Set `API_BASE=""` or same-origin relative `/` in production so `fetch("/api/v1/...")` stays on `www`.

OAuth: Google redirect URI can remain on ECS **or** move to `www/api/v1/auth/social/google/callback` if the façade forwards it — must match Google console exactly (canonical URL rule).

### CSRF with Option C + same-origin

- `SameSite=Lax` cookie for session  
- Reject mutating requests whose `Origin` / `Referer` host ∉ allowlist  
- Optional CSRF double-submit for defense in depth  

---

## ADR-003 — Credential delivery after Google OAuth

| Approach | Allowed? |
|----------|----------|
| JWT in query string (current) | **No** (C1) — eliminate |
| JWT in URL fragment | **No** as permanent design |
| One-time `code` in query → server session + Set-Cookie | **Yes** |
| Set-Cookie on API callback with `Domain=.swappystudio.com` without façade | Possible if API is on `api.` sibling; more fragile than same-origin |

**Preferred:** one-time opaque exchange code → create Mongo session → `Set-Cookie` on **frontend origin** (via BFF) or on shared parent domain after ADR-002.

---

## Learning concepts (for maintainers)

1. **Trust boundary** — Browser JS is hostile; secrets must not be readable by JS (HttpOnly).  
2. **Same-site vs same-origin** — Cookie rules depend on eTLD+1 and scheme.  
3. **Defense in depth** — Ownership checks on API remain mandatory even with perfect sessions.  
4. **Fail closed** — Missing JWT secret / mock storage in prod should refuse boot.  
5. **Capability-based uploads** — Presigned URLs keep large bytes off your app servers.
