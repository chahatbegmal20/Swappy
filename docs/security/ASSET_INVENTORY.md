# Asset inventory & entry points

## Sensitive assets

| Asset | Location | Notes |
|-------|----------|-------|
| `JWT_SECRET` | Host env / Secrets Manager | Must be stable ≥32 chars |
| Google client secret | Host env | Never in frontend |
| Mongo connection string | Host env | Atlas |
| S3/R2 keys | Host env | |
| User PII | Mongo `users` | email, phone, name |
| Provider OAuth tokens | Mongo `social_accounts` | access/refresh |
| Uploaded media | S3 or `local_uploads/` | |
| Session JWT | Browser localStorage (+ URL briefly) | High value |

## Public entry points

- Web: `/`, `/auth/login`, `/auth/register`, `/auth/callback`, `/trends`  
- API: `/health`, `/`, `/api/v1/auth/register|login`, OAuth authorize/callback, `/api/v1/auth/social/providers`, trends **GET**s, `/dashboard/market`  
- Dev-only: `/mock-upload/*` when mock storage allowed  

## Protected entry points

- `/api/v1/projects/*`, `/uploads/*`, `/scoring/*`, `/dashboard/creator`, `/auth/me`, set-password  
- `POST /api/v1/trends/refresh` (**auth required after Phase 1**)  

## Disabled / gated

- Phone OTP — development only  
- Account delete UI — disabled pending API  
- OpenAPI `/docs` — off in production  

## CI/CD assets

| Asset | Risk |
|-------|------|
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in GitHub secrets | Long-lived; prefer OIDC |
| ECR `swappy-api` images | Supply chain — pin digests later |
