# Plan — migrate away from URL JWTs and localStorage

**Status:** Planning only (Phase 2 implementation)  
**Related findings:** C1, H1, M9  

## Current behaviour

1. OAuth callback redirects to `/auth/callback?token=<JWT>`  
2. Client stores JWT in `localStorage.swappy_token`  
3. Every API call sends `Authorization: Bearer <JWT>`  
4. Logout only deletes localStorage — server cannot revoke  

## Target behaviour

1. OAuth callback redirects with a **one-time opaque code** (or sets cookie server-side)  
2. Session established via **HttpOnly; Secure; SameSite=Lax** cookie  
3. Short-lived access token (5–15 min) + refresh token (rotated, server-side or Redis)  
4. CSRF defense for cookie-authenticated mutating requests (double-submit or SameSite + origin check)  
5. Explicit logout hits API revoke endpoint  

## Recommended approach (BFF-light)

### Phase 2a — stop query-string JWT (minimal)

1. API callback stores JWT (or session id) in Redis keyed by `code = secrets.token_urlsafe(32)`, TTL 60s  
2. Redirect to `{FRONTEND}/auth/callback?code=…` (no JWT)  
3. Frontend `POST /api/v1/auth/session/exchange { code }`  
4. Response sets **HttpOnly cookie** `swappy_session` (or still returns body token temporarily)  

Even if step 4 still returns JSON token once, removing JWT from URLs closes C1 partially.

### Phase 2b — HttpOnly session cookie

1. Cookie: `swappy_at` (access) + `swappy_rt` (refresh) or single session id  
2. Next.js `middleware.ts` optional for UX redirects; **API remains source of truth**  
3. `api.ts` uses `credentials: "include"` and stops reading localStorage  
4. CORS stays allowlist; `allow_credentials=true` already set  

### Phase 2c — revocation & rotation

1. Refresh token family in Redis/Mongo  
2. Logout deletes server session  
3. Reduce access TTL from 1440 → ≤15 minutes  

## Migration steps (rollout)

| Step | Action | Rollback |
|------|--------|----------|
| 1 | Deploy code exchange + dual-read (cookie **or** Bearer) | Feature flag off |
| 2 | Switch OAuth redirect to `code=` | Re-enable `token=` flag |
| 3 | Frontend prefers cookie; stop writing localStorage | Keep Bearer fallback 1 release |
| 4 | Remove Bearer-from-localStorage path | — |
| 5 | Force re-login (bump cookie name / JWT `ver` claim) | — |

## Frontend touchpoints

- `apps/web/src/lib/api.ts` — storage + `fetch` credentials  
- `apps/web/src/app/auth/callback/page.tsx` — exchange code  
- `apps/web/src/lib/store.ts` — logout clears cookie via API  
- `apps/web/src/components/auth-guard.tsx` — rely on `/auth/me` cookie session  

## Backend touchpoints

- `apps/api/routers/auth.py` — callback, exchange, logout, refresh  
- `apps/api/core/security.py` — read cookie or Bearer  
- Redis (existing `REDIS_URL`) for one-time codes + refresh  

## Verification

- [ ] OAuth Location header contains no JWT  
- [ ] Application tab: HttpOnly cookie present; no `swappy_token` in localStorage  
- [ ] XSS proof-of-concept cannot `fetch` token from JS  
- [ ] Logout invalidates refresh; reuse → 401  
- [ ] Cross-site POST without CSRF token rejected  

## Out of scope for this plan

- Full passkey / WebAuthn  
- Device binding  
- Agents/MCP auth (separate design when agents ship)  
