# Security implementation status

**Branch:** `security/phase-1-hardening` @ `6c33a1e`  
**Rule for next steps:** documentation approved; **wait for explicit approval before further application-code changes** (per Phase 1.5 brief).

---

## Step 2 — Revalidation results (latest branch)

| Question | Result | Confidence |
|----------|--------|------------|
| Is `POST /api/v1/auth/social` (Google ID token) used by the UI? | **No.** `api.socialLogin` exists in `apps/web/src/lib/api.ts` but has **zero call sites**. Live UI uses `/authorize` redirect only. Endpoint remains attack surface if left open. | Confirmed |
| Are phone OTP endpoints reachable in production? | **On this branch:** handlers return **403** unless `APP_ENV=development`. UI hidden unless `phone_auth_enabled`. **Live prod before deploy:** Assumption — verify after merge. | Confirmed (code) / Assumption (live) |
| Can mock storage enable outside development? | **Yes in staging** if `ALLOW_MOCK_STORAGE=true` (`allow_mock_storage = is_development or ALLOW_MOCK_STORAGE`). **Production:** boot **rejects** `ALLOW_MOCK_STORAGE=true` on this branch. `render.yaml` still sets mock true for staging. | Confirmed |
| Are provider tokens required for current features? | **No.** Written into `SocialAccount` on OAuth; **never read** afterward for product features. Safe to stop persisting (or encrypt) without feature loss today. | Confirmed |
| Is Redis provisioned? | **Unknown in AWS.** Repo: `REDIS_URL` default + Celery worker only. **API does not use Redis.** Do not add Redis for sessions. | Confirmed (code) / Unverified (infra) |
| Are AI agents UI stubs? | **Yes.** `capabilities/config.ts` marks agents/generate/campaigns `coming_soon`; `mcp-edit` `in_development`; no agent API routers. | Confirmed |
| Is JWT ephemeral fallback reachable in production? | **No longer on this branch.** Weak/missing JWT in staging/prod → `validate_for_runtime` raises. Old minting path removed. | Confirmed |
| Do ownership checks cover every resource op? | **Projects / uploads / scoring / creator dashboard:** yes via `_get_owned_project` or `user_id` filter. **Gaps:** public trends*, public market overview, mock-upload (dev/staging). No IDOR automated tests yet. | Confirmed |
| Do public trends GETs expose private data? | **No user PII.** Returns shared `TrendSignal` cache (topics, velocity, volume, raw_data from public RSS/HN/Reddit). Risk is abuse/DoS and optional news URLs in `raw_data`, not account takeover. | Confirmed |

\* `POST /trends/refresh` requires auth on this branch; GET list/search/heatmap/detail remain public by design.

**Live AWS env vars:** not re-read (credentials unavailable). Use `PROD_ENV_VERIFICATION.md`.

---

## Containment items — status map

| # | Containment goal | Status on branch | Still needs approval to… |
|---|------------------|------------------|---------------------------|
| 1 | Disable mock uploads outside local/dev policy | Partial: prod boot ban + path/size guards; staging can still enable mock | Optionally force mock **development-only** (ignore flag in staging) |
| 2 | Path containment, auth, size limits on mock | Path + 50 MiB; **still unauthenticated** when mock on | Add auth or signed mock tokens if staging keeps mock |
| 3 | Disable phone OTP in production | Done (403 + UI gate) | Merge/deploy |
| 4 | Validate Google aud or remove path | Aud/iss checks added; UI unused | Prefer **remove/disable** unused `POST /auth/social` entirely |
| 5 | Restrict trends refresh | Done (Bearer required) | Merge/deploy |
| 6 | Canonical OAuth callback URLs | Done (`BACKEND_URL`) | Merge/deploy; confirm Google console matches |
| 7 | Safe production config enforcement | Done for JWT/mock/debug/URLs | Complete live checklist |
| 8 | Remove misleading account deletion | Done (UI disabled) | Later: real `DELETE /auth/me` |
| 9 | No tokens/OTPs/credentials in logs | Done for reviewed paths | Log review in CloudWatch after deploy |
| 10 | Plan to eliminate JWT-in-URL | Docs: `JWT_MIGRATION_PLAN.md` + `ARCHITECTURE_DECISIONS.md` | Implement Option C + same-origin BFF |

---

## Documentation set

| File | Purpose |
|------|---------|
| `PHASE1_AUDIT.md` | Executive audit |
| `THREAT_MODEL.md` | STRIDE |
| `FINDINGS.md` | Finding register |
| `REQUEST_LIFECYCLE.md` | Google → project |
| `ASSET_INVENTORY.md` | Assets / entry points |
| `ARCHITECTURE_DECISIONS.md` | Options A/B/C + Vercel proxy ADR |
| `SECURITY_TEST_MATRIX.md` | Tests |
| `SECURITY_IMPLEMENTATION_STATUS.md` | This file |
| `PHASE1_5_CONTAINMENT_PLAN.md` | Minimal-change plan + teach-back |
| `PROD_ENV_VERIFICATION.md` | Live host checklist |
| `JWT_MIGRATION_PLAN.md` | Session migration (Mongo-first) |

---

## Safeguards (honoured)

- Working on **`security/phase-1-hardening`**, not production deploy from this step  
- No live AWS mutations, no prod DB changes, no credential rotation, no user deletion  
- No Redis introduction for sessions  
- No blind rewrite of working OAuth without approved migration (ADR-001/002)  
