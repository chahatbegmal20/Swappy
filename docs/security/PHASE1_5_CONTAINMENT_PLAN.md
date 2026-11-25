# Phase 1.5 — Immediate security containment plan

**Intent:** Minimal diffs, critical first, no unnecessary refactors.  
**Gate:** Present plan → **await approval** → then implement remaining code (some items already on `security/phase-1-hardening`).

---

## 1. Mock uploads outside local development

**Existing:** `ALLOW_MOCK_STORAGE` or development enables `/mock-upload` (`storage.py`, `main.py`). Staging blueprint sets mock `true`.

**Why bad:** Unauthenticated disk write / traversal / fill when enabled.

**New (proposed hardening beyond branch):** Treat mock as **`APP_ENV=development` only** — ignore `ALLOW_MOCK_STORAGE` in staging/prod (or keep staging flag but require auth). Prefer real S3/R2.

**Principle:** Least privilege; fail closed.

**Breaks:** Staging demos without S3.

**Test:** T-C2* matrix. **Rollback:** Restore flag behaviour behind env.

**Learn:** Feature flags that widen attack surface must be environment-scoped.

---

## 2. Path containment, auth, size limits

**Existing on branch:** `..` rejected; path contained under `local_uploads`; 50 MiB cap; 404 if mock off.

**Still open:** No authentication on mock PUT when enabled.

**Proposed:** Require Bearer **or** HMAC of `s3_key` matching a short-lived server secret for mock URLs.

**Principle:** Authenticate every state-changing endpoint.

**Breaks:** Naive curl uploads in local scripts.

**Test:** Traversal + unauth → 401. **Rollback:** Revert auth check only.

---

## 3. Phone OTP in production

**Existing on branch:** 403 unless development; UI gated.

**Proposed:** Keep; remove dead phone UI code paths later if unused.

**Principle:** Don’t ship half-finished auth.

**Breaks:** None in prod (was incomplete anyway).

**Test:** T-H7. **Rollback:** Feature flag `PHONE_AUTH_ENABLED`.

---

## 4. Google direct ID token path

**Existing:** UI unused; branch validates `aud`/`iss`/`email_verified` via tokeninfo.

**Proposed (preferred minimal):** **Disable** `POST /api/v1/auth/social` with 410 Gone (or 404) — remove dead client method. Keep authorize redirect as sole Google path. tokeninfo is weaker than full JWT signature verify with Google’s JWKS; disabling unused path is cleaner than “perfecting” dead code.

**Principle:** Reduce attack surface (unused endpoints).

**Breaks:** Any unknown client still calling `socialLogin`.

**Test:** POST → 410; authorize flow still works. **Rollback:** Re-enable with aud checks.

**Learn:** Dead API surface still counts for attackers.

---

## 5. Public trends refresh

**Existing on branch:** `Depends(get_current_user)`.

**Proposed:** Keep; optionally rate-limit; leave GET public (shared market data only).

**Principle:** Expensive mutations are authenticated.

**Breaks:** Anonymous “refresh” bots (desired).

**Test:** T-H6. Radar page must send Bearer (already does when logged in).

---

## 6. Canonical OAuth callback URLs

**Existing on branch:** `redirect_uri` from `settings.BACKEND_URL` only.

**Proposed:** Keep; document Google console must match exactly; after BFF, reconsider `www` callback.

**Principle:** Don’t trust client-controlled Host headers.

**Breaks:** Mis-set `BACKEND_URL` → Google mismatch.

**Test:** T-H9. **Rollback:** N/A (old behaviour was unsafe).

---

## 7. Safe production configuration

**Existing on branch:** Fail closed on weak JWT, localhost DB/URLs, `APP_DEBUG`, mock in production.

**Proposed:** Complete `PROD_ENV_VERIFICATION.md` on live ECS manually.

**Principle:** Secure defaults / fail closed.

**Assumption:** Live values not verified in this environment.

---

## 8. Misleading account deletion

**Existing on branch:** UI disabled.

**Proposed:** Later Phase — `DELETE /auth/me` with cascade; then re-enable UI.

**Principle:** Honest UX; don’t fake destructive ops.

---

## 9. Secrets in logs

**Existing on branch:** No OTP plaintext logs; token exchange logs status only; OAuth success logs path without query.

**Proposed:** CloudWatch review post-deploy; scrub middleware if any access logs include full callback URLs.

**Principle:** Minimize sensitive data in logs.

---

## 10. Eliminate JWT from OAuth callback URLs

**Plan:** See `ARCHITECTURE_DECISIONS.md` (Option C + ADR-002) and updated `JWT_MIGRATION_PLAN.md`.

**Do not implement** until you approve same-origin façade + Mongo sessions.

**Not allowed as permanent fix:** URL fragments carrying bearers.

---

## Affected files (remaining / already touched)

| Area | Files |
|------|-------|
| Config | `apps/api/core/config.py` |
| Mock upload | `apps/api/main.py`, `apps/api/core/storage.py` |
| Auth | `apps/api/routers/auth.py` |
| Trends | `apps/api/routers/trends.py` |
| Web settings / social | `apps/web/src/app/settings/page.tsx`, `social-auth.tsx`, `lib/api.ts` |
| Future BFF | `apps/web/vercel.json`, `lib/api.ts`, new session router |
| Future sessions | `apps/api/models/database.py` (+ `Session` doc), auth callback |

## Migration strategy (high level)

1. Merge containment PR → staging → prod checklist  
2. Approve ADR-001/002  
3. Implement same-origin rewrite for JSON API only  
4. One-time OAuth `code` → Mongo session + HttpOnly cookie  
5. Dual-read cookie \| Bearer one release  
6. Remove localStorage JWT  

## What will wait for your “go”

- Disabling unused `POST /auth/social`  
- Staging mock = development-only  
- Auth on mock upload  
- Same-origin BFF + Mongo sessions  
- Real account delete API  
- Stopping persistence of provider OAuth tokens  
