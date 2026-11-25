# Phase 1 Findings Register (revalidated)

**Branch reviewed:** `security/phase-1-hardening`  
**Confidence:** Confirmed (source) · Theoretical · Assumption (live infra)  
**Remediation:** `Fixed on branch` · `Doc only` · `Open` · `Partial`

For each finding: id, severity, confidence, file:lines (approx), behaviour, impact, solution, regression, verification.

---

## Revalidation of critical questions

See `SECURITY_IMPLEMENTATION_STATUS.md` Step 2. Summary: Google direct login **unused by UI**; phone OTP **blocked outside development on this branch**; mock **still flaggable in staging**; provider tokens **not required**; Redis **unused by API**; agents **stubs**; JWT ephemeral mint **removed**; ownership **OK on private resources**; trends GET **public market cache only**.

---

## Critical (2)

### C1 — JWT in OAuth callback query string
- **Severity:** Critical · **Confidence:** Confirmed · **Remediation:** Open (migration)  
- **Files:** `apps/api/routers/auth.py` (~475–481); `apps/web/src/app/auth/callback/page.tsx` (~22–39)  
- **Behaviour:** Redirect `?token=<JWT>`  
- **Impact:** History/Referer/log leakage → session theft  
- **Solution:** One-time code → Mongo session + HttpOnly cookie (`ARCHITECTURE_DECISIONS.md`)  
- **Regression:** OAuth mobile/desktop redirects  
- **Verify:** No `token=` in Location; session still works  

### C2 — Unauthenticated mock upload when mock enabled
- **Severity:** Critical · **Confidence:** Confirmed · **Remediation:** Partial  
- **Files:** `apps/api/main.py` (~98–120); `apps/api/core/storage.py` (~39–80)  
- **Behaviour:** `PUT /mock-upload/{path}` writes disk; enabled if development **or** `ALLOW_MOCK_STORAGE`  
- **Impact:** Traversal/DoS/malware drop when mock on  
- **Solution:** Prod boot forbids mock; path contain + 50 MiB; still need auth or staging mock=off  
- **Regression:** Local/staging upload without S3  
- **Verify:** Prod checklist; traversal → 400; mock off → 404  

---

## High (11)

### H1 — JWT in localStorage
- **Confirmed** · Open · `apps/web/src/lib/api.ts` ~153–167  
- XSS → full account. Migrate to HttpOnly session.  

### H2 — In-memory OAuth state / OTP store
- **Confirmed** · Open · `apps/api/routers/auth.py` ~38–40, 432, 450  
- Multi-ECS task breaks OAuth. Store state in **Mongo** (not Redis-by-default).  

### H3 — Google ID token path / audience
- **Confirmed** · Partial · `auth.py` `_verify_google_id_token`  
- UI **does not call** `socialLogin`; aud checks added. Prefer **disable endpoint**.  
- Note: tokeninfo ≠ full JWKS signature verify.  

### H4 — OAuth email auto-link without verification proof
- **Confirmed** · Open · `auth.py` `_find_or_create_social_user` ~169–193  
- Account takeover via email collision. Require verified email + explicit link.  

### H5 — `/auth/me` can set email/phone without verify
- **Confirmed** · Open · `auth.py` ~677–688  
- Identity hijack. Remove from free PATCH or require challenge.  

### H6 — Public trends refresh
- **Confirmed** · Fixed on branch · `trends.py` refresh + `Depends(get_current_user)`  
- Was anonymous DoS/cache wipe.  

### H7 — Phone OTP incomplete
- **Confirmed** · Fixed on branch · send/verify 403 outside development  
- Live prod reachability before deploy = Assumption.  

### H8 — Fake account delete
- **Confirmed** · Fixed on branch · settings UI disabled  
- Was client logout only.  

### H9 — OAuth redirect_uri from Host / X-Forwarded-*
- **Confirmed** · Fixed on branch · canonical `BACKEND_URL`  
- Host-header confusion.  

### H10 — Provider OAuth tokens stored unused
- **Confirmed** · Open · `database.py` SocialAccount; write-only in practice  
- DB breach expands blast radius. Stop storing or encrypt.  

### H11 — Ephemeral JWT_SECRET minting
- **Confirmed** · Fixed on branch · no longer mints; fail closed  
- Was masking missing secrets across ECS tasks.  

---

## Medium (10)

### M1 — No Next.js middleware auth  
Confirmed · Open · UX-only `AuthGuard`  

### M2 — No auth rate limiting  
Confirmed · Open · login/register/OTP/refresh  

### M3 — User enumeration via login messages  
Confirmed · Open · `auth.py` login/register detail strings  

### M4 — Email index not unique  
Confirmed · Open · `database.py` User indexes  

### M5 — Upload filename unsanitized in S3 key  
Confirmed · Open · `uploads.py` ~34; `PresignRequest`  

### M6 — CORS allow_credentials + broad methods  
Confirmed · Open · `main.py` ~45–58 · Origins allowlisted  

### M7 — GitHub Actions long-lived AWS keys  
Confirmed · Open · `publish-api-ecr.yml` · Prefer OIDC  

### M8 — Thin automated security tests  
Partial · Matrix in `SECURITY_TEST_MATRIX.md`  

### M9 — 24h JWT, no revocation  
Confirmed · Open · addressed by Option C  

### M10 — Cross-origin Vercel↔ECS complicates cookies  
Confirmed · Open · ADR-002 same-origin façade  

---

## Low (5)

### L1 — `/social/providers` exposes env URLs · Confirmed · Soften later  
### L2 — Password policy min length 8 only · Confirmed · Open  
### L3 — Agents/MCP UI stubs only · Confirmed · N/A attack surface  
### L4 — `/health` returns `env` · Confirmed · Low recon  
### L5 — Logging of secrets · Partial fixed · Continue CloudWatch review  

**Count:** 2 Critical + 11 High + 10 Medium + 5 Low = **28 findings**.

---

## Already-good controls (not findings)

- Project/upload/score ownership checks  
- Production OpenAPI disabled when `is_production`  
- `.env` gitignored  
- OAuth `state` via `secrets.token_urlsafe`  
- `SocialAccountResponse` omits tokens from API responses  
