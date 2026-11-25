# Security test matrix — Phase 1 / 1.5

Legend: **A** = automated unit/integration · **M** = manual · **P** = production smoke (no secrets in logs)

| ID | Control | Test | Type | Status |
|----|---------|------|------|--------|
| T-C1 | No JWT in OAuth URL | Complete Google login; Location / final URL must not contain `token=` | M | Pending (migration) |
| T-C2a | Mock upload disabled when mock off | `PUT /mock-upload/x` → 404 | A/M | Code on branch; prod P pending |
| T-C2b | Path traversal | `PUT .../../etc/passwd` → 400 | A | Pending dedicated test |
| T-C2c | Size cap | Body > 50 MiB → 413 | M | Code on branch |
| T-C2d | Prod boot | `APP_ENV=production` + `ALLOW_MOCK_STORAGE=true` raises | A | Covered `test_production_rejects_mock_storage` |
| T-H3 | Google aud | Foreign `aud` ID token → 401 | A | Pending |
| T-H6 | Trends refresh auth | Unauth `POST /trends/refresh` → 401 | M/P | Code on branch |
| T-H7 | Phone OTP prod | Non-dev `POST /phone/send-otp` → 403 | M | Code on branch |
| T-H8 | Delete UI | Settings shows Unavailable; no client-only wipe of “account” | M | Code on branch |
| T-H9 | Canonical OAuth URI | Poisoned `X-Forwarded-Host` ignored | A | `test_get_redirect_uri_uses_canonical_backend_url_not_forwarded_host` |
| T-H11 | Weak JWT staging | Insecure secret → RuntimeError | A | `test_staging_rejects_insecure_jwt_secret` |
| T-OWN | Project IDOR | User B cannot GET/PATCH/DELETE user A project | A | Pending |
| T-OWN2 | Upload IDOR | User B cannot complete user A upload_id | A | Pending |
| T-OWN3 | Score IDOR | User B cannot analyze / read scores for A | A | Pending |
| T-TREND | Public trends | GET trends returns only TrendSignal fields (no user PII) | M | Confirmed by schema review |
| T-CORS | Credentialed cross-origin | Disallowed Origin rejected | M | Pending |
| T-LOG | Logs | Auth failure / OAuth exchange logs contain no JWT/OTP/provider token bodies | M | Code on branch |
| T-BFF | Same-origin façade | After ADR-002, cookie set on www; `/api/v1/auth/me` works without Authorization header | M | Not started |
| T-UPLOAD | Direct-to-storage | Browser PUT to signed URL succeeds; body never hits Vercel function | M | Existing design; enforce in prod |

## CI currently runs

```text
pytest tests/test_config_env_loading.py
     tests/test_auth_url_resolution.py
     tests/test_settings_runtime.py
```

## Gaps to add before Phase 2 merge

1. IDOR suite for projects/uploads/scoring  
2. Mock-upload path/auth tests  
3. Phone OTP env gate test  
4. Trends refresh 401 test (TestClient + overridden dependency)  
