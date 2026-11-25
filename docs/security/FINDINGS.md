# Phase 1 Findings Register

Severity: Critical / High / Medium / Low  
Confidence: Confirmed / Theoretical / Assumption  

Legend for **Remediation**: `Fixed on branch` | `Doc/checklist` | `Open (Phase 2+)`

---

## Critical

### C1 — JWT in OAuth callback query string
- **Confidence:** Confirmed  
- **Files:** `apps/api/routers/auth.py` (callback redirect); `apps/web/src/app/auth/callback/page.tsx`  
- **Behaviour:** `?token=<JWT>` returned to browser  
- **Risk:** History, Referer, logs, screenshots  
- **Remediation:** Open — see `JWT_MIGRATION_PLAN.md`  
- **Complexity:** M | **Regression:** OAuth mobile/desktop  

### C2 — Unauthenticated mock upload
- **Confidence:** Confirmed  
- **Files:** `apps/api/main.py` (`/mock-upload`); `apps/api/core/storage.py`  
- **Behaviour:** PUT writes under `local_uploads/` when mock allowed  
- **Risk:** Traversal / disk fill  
- **Remediation:** **Fixed on branch** — path containment, size cap, 404 when mock off; production boot rejects `ALLOW_MOCK_STORAGE=true`  
- **Verify:** Prod env checklist; attempt `../` path → 400  

---

## High

### H1 — JWT in localStorage
- **Confidence:** Confirmed — `apps/web/src/lib/api.ts`  
- **Remediation:** Open — `JWT_MIGRATION_PLAN.md`  

### H2 — In-memory OAuth/OTP state
- **Confidence:** Confirmed — `apps/api/routers/auth.py` `_oauth_state_store`  
- **Remediation:** Open (Redis)  

### H3 — Google ID token without aud
- **Confidence:** Confirmed  
- **Remediation:** **Fixed on branch** — `aud`/`iss`/`email_verified` checks  

### H4 — Email auto-link on OAuth
- **Confidence:** Confirmed — `_find_or_create_social_user`  
- **Remediation:** Open  

### H5 — `/auth/me` email/phone change without verify
- **Confidence:** Confirmed  
- **Remediation:** Open  

### H6 — Public `POST /trends/refresh`
- **Confidence:** Confirmed  
- **Remediation:** **Fixed on branch** — `Depends(get_current_user)`  

### H7 — Phone OTP incomplete
- **Confidence:** Confirmed  
- **Remediation:** **Fixed on branch** — 403 outside development; UI hidden unless `phone_auth_enabled`  

### H8 — Misleading account delete
- **Confidence:** Confirmed — settings cleared local token only  
- **Remediation:** **Fixed on branch** — UI disabled until server cascade  

### H9 — OAuth redirect_uri from forwarded Host
- **Confidence:** Confirmed  
- **Remediation:** **Fixed on branch** — canonical `BACKEND_URL`  

### H10 — Provider tokens stored in Mongo
- **Confidence:** Confirmed — `SocialAccount.access_token` / `refresh_token`  
- **Remediation:** Open  

### H11 — Ephemeral JWT_SECRET minting
- **Confidence:** Confirmed — former `config.apply_platform_defaults`  
- **Remediation:** **Fixed on branch** — fail closed in staging/prod  

---

## Medium

| ID | Issue | Remediation |
|----|-------|-------------|
| M1 | No Next.js middleware | Open |
| M2 | No auth rate limits | Open |
| M3 | Login enumeration messages | Open |
| M4 | Email index not unique | Open |
| M5 | Unsanitized upload filename | Open |
| M6 | Broad CORS methods/headers | Open (origins OK) |
| M7 | GitHub Actions static AWS keys | Open (OIDC) |
| M8 | Thin security tests | Partially improved (URL/JWT/mock tests) |
| M9 | 24h JWT, no revocation | Open (with migration) |

---

## Low

| ID | Issue | Remediation |
|----|-------|-------------|
| L1 | `/social/providers` env recon | Soften later |
| L2 | Password policy min 8 only | Open |
| L3 | Agents stub | N/A |
| L4 | `/health` exposes `env` | Low |
| L5 | Logging review | **Fixed on branch** — no OTP values / token bodies in logs |

---

## Log review notes (L5 / C1)

| Location | Before | After |
|----------|--------|-------|
| OAuth success log | Logs redirect path without query (already safe) | Unchanged |
| Token exchange failure | Logged `resp.text` (may contain secrets) | Status code only |
| Phone OTP | Logged full OTP in development | Logs phone suffix only; OTP only in JSON `dev_otp` in development |
| Google aud reject | — | Logs unexpected `aud` value only (not token) |
