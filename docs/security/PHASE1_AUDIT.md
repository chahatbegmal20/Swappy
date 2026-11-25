# Phase 1 — SwappyStudio Security Audit

**Branch:** `security/phase-1-hardening`  
**Documentation approval:** Granted (Phase 1.5 brief)  
**Application code:** Further changes **await explicit approval**  

## Executive summary

Swappy’s foundation (OAuth, bcrypt passwords, per-user project ownership) is real. Confirmed weaknesses centre on **credential delivery** (JWT in URL + localStorage), **optional mock upload**, **incomplete phone auth**, **public expensive mutations** (trends refresh — mitigated on branch), and **cross-origin** Vercel↔ECS topology that blocks safe HttpOnly cookies without a same-origin façade.

**28 findings** are registered in `FINDINGS.md` (2 Critical, 11 High, 10 Medium, 5 Low), with revalidation notes in `SECURITY_IMPLEMENTATION_STATUS.md`.

## Preferred target architecture (pending approval)

1. **Option C** — opaque MongoDB sessions + HttpOnly cookies (`ARCHITECTURE_DECISIONS.md`)  
2. **Same-origin** browser API via Vercel rewrite/BFF to ECS — **do not** proxy large media or unbounded AI bodies (Vercel ~120s proxy TTFB; ~4.5 MB function bodies)  
3. Uploads remain **presigned → direct object storage**

## Document index

| Doc | Role |
|-----|------|
| [THREAT_MODEL.md](./THREAT_MODEL.md) | STRIDE |
| [FINDINGS.md](./FINDINGS.md) | Full finding sheets |
| [REQUEST_LIFECYCLE.md](./REQUEST_LIFECYCLE.md) | Google → project |
| [ASSET_INVENTORY.md](./ASSET_INVENTORY.md) | Assets & entry points |
| [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md) | A/B/C + BFF ADR |
| [PHASE1_5_CONTAINMENT_PLAN.md](./PHASE1_5_CONTAINMENT_PLAN.md) | Minimal containment + teach-back |
| [SECURITY_IMPLEMENTATION_STATUS.md](./SECURITY_IMPLEMENTATION_STATUS.md) | Revalidation & status |
| [SECURITY_TEST_MATRIX.md](./SECURITY_TEST_MATRIX.md) | Tests |
| [JWT_MIGRATION_PLAN.md](./JWT_MIGRATION_PLAN.md) | Session migration |
| [PROD_ENV_VERIFICATION.md](./PROD_ENV_VERIFICATION.md) | Live env checklist |

## What was already changed on this branch (pre–1.5)

Containment code for phone OTP gate, trends refresh auth, canonical OAuth URI, Google aud checks, mock path/size + prod mock ban, JWT fail-closed, delete UI disable, log scrubbing — see status map. **Do not treat that as full Phase 2.**

## Safeguards

No production deploy, AWS mutation, DB wipe, credential rotation, or Redis introduction from this documentation step.
