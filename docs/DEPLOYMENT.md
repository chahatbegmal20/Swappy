# Swappy — Environments & Deployment

Early-stage target: **Vercel** (Next.js) + **Railway** (FastAPI) + **MongoDB Atlas** + **Cloudflare R2** (or S3).  
Git workflow: **feature branch → PR → `main`**, then promote the same revision staging → production.

```text
feature/* ──PR──▶ main ──auto──▶ staging ──smoke──▶ production
```

Do **not** maintain long-lived `dev` / `prod` branches. Environments are separate deploy targets with separate secrets.

---

## 1. Atlas databases

Create two database names on your cluster (or separate clusters later):

| Environment | `MONGO_DB_NAME` |
|-------------|-----------------|
| Local       | `swappy` (or `swappy_dev`) |
| Staging     | `swappy_staging` |
| Production  | `swappy_prod` |

Network Access: allow Railway egress IPs (or `0.0.0.0/0` only while bootstrapping).

---

## 2. Object storage (R2 / S3)

1. Create buckets: `swappy-staging-uploads`, `swappy-prod-uploads`
2. Create an API token with object read/write
3. Set on the API service:

```env
S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=swappy-staging-uploads
S3_REGION=auto
S3_FORCE_PATH_STYLE=true
```

Locally you can keep MinIO via `docker compose up -d` or continue using mock uploads when MinIO is down.

---

## 3. Railway — API (staging first)

1. New Railway project → **Deploy from GitHub** → `chahatbegmal20/Swappy`
2. Root / Dockerfile: uses [`railway.toml`](../railway.toml) → [`infra/docker/Dockerfile.api`](../infra/docker/Dockerfile.api)
3. Create an environment named **staging** and paste values from [`.env.staging.example`](../.env.staging.example)
4. After first deploy, copy the public HTTPS URL into:
   - `BACKEND_URL`
   - Vercel `NEXT_PUBLIC_API_URL`
5. Duplicate the service/environment for **production** using [`.env.production.example`](../.env.production.example)

Health check: `GET /health` should return `{"status":"healthy","env":"staging"}`.

---

## 4. Vercel — Web

1. Import the same GitHub repo in Vercel
2. **Root Directory:** `apps/web`
3. Framework: Next.js (see [`apps/web/vercel.json`](../apps/web/vercel.json))
4. Project env:

| Name | Staging example |
|------|-----------------|
| `NEXT_PUBLIC_API_URL` | `https://<railway-staging-host>` |

5. Production branch: `main`  
6. Optional: create a second Vercel project (or use Preview + Production envs) for a stable staging hostname

After deploy, set API `FRONTEND_URL` to the Vercel HTTPS URL and redeploy the API so CORS + OAuth redirects match.

---

## 5. Promote staging → production

1. Merge PR to `main`
2. Confirm staging deploy is healthy (auth, trends, upload smoke)
3. Deploy / promote the **same commit** on Railway production + Vercel production
4. Use GitHub Environment protection rules for `production` when the team grows

---

## 6. Required env checklist

See also [`.env.example`](../.env.example), [`.env.staging.example`](../.env.staging.example), [`.env.production.example`](../.env.production.example).

| Variable | Local | Staging/Prod |
|----------|-------|--------------|
| `APP_ENV` | `development` | `staging` / `production` |
| `APP_DEBUG` | `true` | `false` |
| `DATABASE_URL` | Atlas or local | Atlas |
| `MONGO_DB_NAME` | `swappy` | `swappy_staging` / `swappy_prod` |
| `JWT_SECRET` | weak OK | unique ≥ 32 chars |
| `FRONTEND_URL` | `http://localhost:3000` | `https://…` |
| `BACKEND_URL` | `http://127.0.0.1:8000` | `https://…` |
| `S3_*` | MinIO or mock | R2/S3 required |
| `NEXT_PUBLIC_API_URL` | optional | Railway API URL |

Staging/production refuse to start if JWT/DB/HTTPS URLs look unsafe (`Settings.validate_for_runtime`).

---

## 7. Later migration path

The API image is already portable. When you outgrow Railway/Vercel:

- Same Dockerfile → Fly.io / Cloud Run / ECS
- Same Next app → Cloudflare / AWS Amplify / container
- Same `DATABASE_URL` / `S3_*` / `REDIS_URL` contract — only host env values change
