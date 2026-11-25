# Phase 1 — SwappyStudio Security Audit

**Branch:** `security/phase-1-hardening`  
**Mode:** Read-only analysis + immediate hardening applied on this branch  
**Date:** 2026-11-25  

## Scope

Full monorepo: Next.js web, FastAPI API, Mongo models, CI/CD, deploy docs. No secret values recorded here.

## Executive summary

The product auth loop (Google OAuth → JWT → owned projects) is real, but several **confirmed** issues needed Phase‑1 hardening:

| Priority | Status after this branch |
|----------|---------------------------|
| JWT in URL query + localStorage | Documented; migration plan in `JWT_MIGRATION_PLAN.md` (not yet implemented) |
| Unauthenticated mock upload | Contained + production boot rejects `ALLOW_MOCK_STORAGE=true` |
| Public trends refresh | Now requires Bearer auth |
| Phone OTP without SMS | Disabled outside `APP_ENV=development` |
| Google direct ID token `aud` | Validated against `GOOGLE_CLIENT_ID` |
| OAuth `redirect_uri` from Host headers | Now canonical `BACKEND_URL` only |
| Misleading account delete UI | Disabled with clear copy |
| Ephemeral JWT minting | Removed — staging/prod fail closed |
| Live ECS env verification | **Blocked** — AWS credentials expired in audit environment |

## Trust boundaries

1. Browser ↔ Vercel (Next.js) — no middleware auth  
2. Browser ↔ ECS/API — Bearer JWT, CORS allowlist  
3. API ↔ Google / IG / X — OAuth code + client secret  
4. API ↔ MongoDB Atlas — PII, OAuth tokens, content metadata  
5. API ↔ S3/R2 or `/mock-upload` — object bytes  
6. GitHub Actions ↔ AWS ECR — long-lived access keys (follow-up: OIDC)

## Positive controls already present

- Project / upload / score ownership checks via `user_id`
- Production OpenAPI docs disabled when `APP_ENV=production`
- Runtime config validation for HTTPS URLs + JWT length
- `.env` gitignored; OAuth `state` uses `secrets.token_urlsafe`
- `SocialAccountResponse` does not return provider tokens to the client

## Related documents

- [THREAT_MODEL.md](./THREAT_MODEL.md) — STRIDE  
- [FINDINGS.md](./FINDINGS.md) — full finding sheets  
- [REQUEST_LIFECYCLE.md](./REQUEST_LIFECYCLE.md) — Google → project  
- [ASSET_INVENTORY.md](./ASSET_INVENTORY.md) — assets & entry points  
- [PROD_ENV_VERIFICATION.md](./PROD_ENV_VERIFICATION.md) — checklist for live hosts  
- [JWT_MIGRATION_PLAN.md](./JWT_MIGRATION_PLAN.md) — leave URL/localStorage JWTs  

## Approval gate

Phase 2 (cookie sessions, Redis OAuth state, account delete API, GitHub OIDC) should not start until product owner signs off on this package.
