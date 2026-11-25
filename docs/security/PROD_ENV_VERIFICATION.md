# Production environment verification checklist

Live ECS inspection during Phase 1 was **blocked** (AWS credentials expired in the audit environment). Complete this against the **production** task definition / secrets console before calling Phase 1 closed.

Do **not** paste secret values into tickets or chat — only pass/fail and lengths.

## Required flags

| Variable | Required production value | Pass? |
|----------|---------------------------|-------|
| `APP_ENV` | `production` | ☐ |
| `APP_DEBUG` | `false` | ☐ |
| `ALLOW_MOCK_STORAGE` | `false` (or unset) | ☐ |
| `FRONTEND_URL` | `https://…` (public site) | ☐ |
| `BACKEND_URL` | `https://…` (ECS public URL) | ☐ |
| `DATABASE_URL` | remote Atlas (not localhost) | ☐ |
| `JWT_SECRET` | present, length ≥ 32, **not** `swappy-dev-secret-change-in-production` | ☐ |
| `JWT_SECRET` stable across tasks / restarts (same value in Secrets Manager) | ☐ |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | set | ☐ |
| Google console redirect URI | exactly `{BACKEND_URL}/api/v1/auth/social/google/callback` | ☐ |

## Boot behaviour (after this branch)

- If `APP_ENV=production` and `ALLOW_MOCK_STORAGE=true` → **process refuses to start**  
- If staging/prod JWT secret missing/weak → **process refuses to start** (no ephemeral mint)

## Smoke checks (no secrets)

```text
GET  /health                         → 200, env=production
PUT  /mock-upload/test               → 404
POST /api/v1/trends/refresh          → 401 without Bearer
POST /api/v1/auth/phone/send-otp     → 403
GET  /docs                           → 404
```

## Staging note

`render.yaml` still sets `ALLOW_MOCK_STORAGE=true` for early staging demos. That is **not** acceptable for production ECS. Staging should move to real S3/R2 and set mock false as soon as practical.

## How to verify on AWS (when credentials work)

1. ECS → cluster → service → Task definition → container → Environment  
2. Confirm names above; for `JWT_SECRET` use Secrets Manager ARN and confirm one shared secret  
3. Re-run smoke checks against the public HTTPS API URL  
