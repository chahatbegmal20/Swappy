# Swappy — Environments & Deployment

Early-stage target: **Vercel** (Next.js) + **Render** (FastAPI, no Docker) + **MongoDB Atlas**.  
Optional later: Cloudflare R2 for uploads, Redis/Celery for workers.

```text
feature/* ──PR──▶ main ──auto──▶ Vercel web + Render API
```

Do **not** maintain long-lived `dev` / `prod` branches. Environments are separate deploy targets with separate secrets.

### Deployment status (Chahat Begmal)

Successfully deployed the early staging stack:

- **Frontend:** Vercel (`https://swappy.vercel.app`) with Root Directory `apps/web`
- **Backend:** Render FastAPI (no Docker), `PYTHON_VERSION=3.11.9`, slim `requirements-api.txt`
- **Database:** MongoDB Atlas — Network Access allows `0.0.0.0/0` so Render can connect
- **Wiring:** `FRONTEND_URL` / `BACKEND_URL` / `NEXT_PUBLIC_API_URL` point at the deployed HTTPS hosts (not localhost)

---

## 1. Frontend (already done)

Vercel project with:

- **Root Directory:** `apps/web`
- Env (set after API is live):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_API_URL` | `https://<your-render-service>.onrender.com` |

Redeploy the web app after changing this env so the browser picks it up.

---

## 2. Atlas database

| Environment | `MONGO_DB_NAME` |
|-------------|-----------------|
| Local | `swappy` |
| Cloud (first deploy) | `swappy_staging` |

Under Atlas **Network Access**, allow `0.0.0.0/0` while bootstrapping (or add Render’s egress IPs later).

Use the same `DATABASE_URL` style as local `.env` (`mongodb+srv://...`).

---

## 3. Backend on Render (no Docker)

Repo includes [`render.yaml`](../render.yaml) and a slim [`requirements-api.txt`](../requirements-api.txt) (avoids torch / heavy ML on free tier). Scoring falls back to the heuristic engine when the full ML stack is missing.

### Create the service

1. Open [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**
2. Connect `chahatbegmal20/Swappy` (branch `main`)
3. Apply the blueprint → service `swappy-api`
   - Or: **New → Web Service** → same repo → settings below manually

**Manual Web Service settings (if not using Blueprint):**

| Field | Value |
|-------|--------|
| Runtime | Python 3 |
| Build command | `pip install -r requirements-api.txt` |
| Start command | `PYTHONPATH=. uvicorn apps.api.main:app --host 0.0.0.0 --port $PORT` |
| Health check path | `/health` |

### Environment variables (Render → Environment)

Copy from [`.env.staging.example`](../.env.staging.example) and set at least:

```env
APP_ENV=staging
APP_DEBUG=false
ALLOW_MOCK_STORAGE=true
PYTHON_VERSION=3.11.9
DATABASE_URL=mongodb+srv://...
MONGO_DB_NAME=swappy_staging
JWT_SECRET=<click Generate — do NOT paste local .env default>
FRONTEND_URL=https://swappy.vercel.app
BACKEND_URL=https://<your-service>.onrender.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Notes:

- **Do not** copy `JWT_SECRET=swappy-dev-secret-change-in-production` from local `.env` — staging rejects it. Use Render’s **Generate** button (32+ chars).
- `BACKEND_URL` auto-fills from Render’s `RENDER_EXTERNAL_URL` if you leave a localhost value; set it explicitly to your `https://….onrender.com` URL when you know it.
- `FRONTEND_URL` must be your real Vercel HTTPS URL (e.g. `https://swappy.vercel.app`), not localhost.
- Pin **Python 3.11** in Render env: `PYTHON_VERSION=3.11.9`, then **Manual Deploy → Clear build cache & deploy**. Logs must show `Python 3.11.x` (not 3.14) — 3.14 often breaks Atlas TLS (`TLSV1_ALERT_INTERNAL_ERROR`).
- Atlas → **Network Access** → allow `0.0.0.0/0` while bootstrapping (or Render’s IPs).
- `ALLOW_MOCK_STORAGE=true` lets uploads work without R2/S3 for early demos.
- Free Render services **spin down** after idle time; the first request after sleep can take ~30–60s.

### Verify

```bash
curl https://<your-render-service>.onrender.com/health
# {"status":"healthy","env":"staging"}

curl https://<your-render-service>.onrender.com/api/v1/auth/social/providers
```

---

## 4. Wire frontend ↔ API

1. Vercel → Project → Settings → Environment Variables  
   `NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com`
2. Redeploy Vercel
3. Render → `FRONTEND_URL=https://<your-vercel-app>.vercel.app` → redeploy API

---

## 5. Google OAuth for the public URLs

In Google Cloud Console → OAuth client:

**Authorized JavaScript origins**

- `https://<your-vercel-app>.vercel.app`

**Authorized redirect URIs**

- `https://<your-render-service>.onrender.com/api/v1/auth/social/google/callback`

Confirm with:

`GET /api/v1/auth/social/providers` → `providers.google.redirect_uri`

---

## 6. Object storage (optional next step)

When you outgrow mock uploads:

1. Create a Cloudflare R2 bucket
2. Set on Render:

```env
ALLOW_MOCK_STORAGE=false
S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=swappy-staging-uploads
S3_REGION=auto
S3_FORCE_PATH_STYLE=true
```

---

## 7. Required env checklist

| Variable | Local | Render staging |
|----------|-------|----------------|
| `APP_ENV` | `development` | `staging` |
| `APP_DEBUG` | `true` | `false` |
| `ALLOW_MOCK_STORAGE` | n/a | `true` until R2 |
| `DATABASE_URL` | Atlas | Atlas |
| `MONGO_DB_NAME` | `swappy` | `swappy_staging` |
| `JWT_SECRET` | weak OK | unique ≥ 32 chars |
| `FRONTEND_URL` | `http://localhost:3000` | Vercel HTTPS URL |
| `BACKEND_URL` | `http://127.0.0.1:8000` | Render HTTPS URL |
| `NEXT_PUBLIC_API_URL` | optional | Render HTTPS URL |

Staging/production refuse to start if JWT/DB/HTTPS URLs look unsafe (`Settings.validate_for_runtime`).

---

## 8. Later migration

- Same slim/API start command → Railway / Fly / Cloud Run (Dockerfile already in `infra/docker/`)
- Same Next app stays on Vercel or moves later
- Same `DATABASE_URL` / `S3_*` contract — only host env values change
