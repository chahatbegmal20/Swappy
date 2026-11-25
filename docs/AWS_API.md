# Swappy API on AWS (not Amplify)

**Do not deploy the FastAPI backend with AWS Amplify Hosting.**  
Amplify Hosting is for frontends (Next.js / static). The Amplify wizard asking for “Frontend build command” / “Build output directory” is the wrong product for `apps/api`.

**Cancel that Amplify create-app flow for the API.**

Recommended backend host (Render replacement, production-capable):

| Piece | Service |
|-------|---------|
| API (FastAPI) | **Amazon ECS Express Mode** (Fargate + HTTPS URL) |
| Container registry | **Amazon ECR** |
| Database | **MongoDB Atlas** (keep as-is) |
| Frontend | **Vercel** + `www.swappystudio.com` (already set up) |

App Runner is sunsetting for new customers — use ECS Express Mode instead.

---

## 1. One-time AWS setup

Region tip: use the same region you care about for latency (e.g. `ap-southeast-2` Sydney if your account is there).

1. Install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) and run `aws login` / configure credentials.
2. Create an ECR repository named `swappy-api`.
3. In IAM, ensure you can use the ECS Express Mode **task execution** and **infrastructure** roles (the console can create these when you first use Express Mode).

---

## 2. Build and push the API image (no local Docker)

ECS Express **requires** an Image URI. You do **not** need Docker on your PC — GitHub Actions builds it.

### A. One-time: IAM user for GitHub

1. AWS Console → **IAM** → Users → Create user (e.g. `swappy-github-ecr`)
2. Attach policies (or a tighter custom policy later):
   - `AmazonEC2ContainerRegistryPowerUser`
   - Plus permission to `ecr:CreateRepository` if the repo does not exist yet
3. **Create access key** → Application running outside AWS
4. GitHub repo → **Settings → Secrets and variables → Actions** → add:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

### B. Run the workflow

1. Push to `main` (or **Actions → Publish API image (ECR) → Run workflow**)
2. Open the successful run → **Summary** → copy the Image URI  
   Looks like: `538705322875.dkr.ecr.ap-southeast-2.amazonaws.com/swappy-api:latest`

### C. Optional: local Docker (only if you install Docker Desktop later)

```powershell
$ACCOUNT = "538705322875"
$REGION = "ap-southeast-2"
$REPO = "$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/swappy-api"
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin "$ACCOUNT.dkr.ecr.$REGION.amazonaws.com"
aws ecr create-repository --repository-name swappy-api --region $REGION 2>$null
docker build -f infra/docker/Dockerfile.api -t swappy-api:latest .
docker tag swappy-api:latest "$REPO:latest"
docker push "$REPO:latest"
```

---

## 3. Create the service (ECS Express Mode)

1. AWS Console → **Elastic Container Service** → **Express Mode** → **Create**
2. Container image URI: the ECR URI from above (`…/swappy-api:latest`)
3. Port: **8080**
4. Health check path: `/health`
5. Add environment variables (same secrets you used on Render):

```env
APP_ENV=staging
APP_DEBUG=false
ALLOW_MOCK_STORAGE=true
# Production checklist (ECS task env):
# APP_ENV=production
# APP_DEBUG=false
# ALLOW_MOCK_STORAGE=false
# JWT_SECRET=<stable 32+ char secret from Secrets Manager / SSM — never ephemeral>
DATABASE_URL=mongodb+srv://...
MONGO_DB_NAME=swappy_staging
JWT_SECRET=<long unique secret, not the local .env default>
FRONTEND_URL=https://www.swappystudio.com
BACKEND_URL=https://<ecs-express-url-after-create>
CORS_ALLOW_ORIGINS=https://swappy.vercel.app,https://swappystudio.com,https://www.swappystudio.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

6. After create, copy the public HTTPS URL Express Mode gives you.
7. Set `BACKEND_URL` to that URL and **redeploy / update** the service so OAuth callbacks match.

---

## 4. Wire the rest of the stack

| Where | Change |
|-------|--------|
| **Vercel** | `NEXT_PUBLIC_API_URL` = ECS HTTPS URL → **Redeploy** web |
| **Google OAuth** | Authorized redirect URI = `{BACKEND_URL}/api/v1/auth/social/google/callback` |
| **Google OAuth** | Keep JS origins for `https://www.swappystudio.com` |
| **Atlas** | Network Access still allows `0.0.0.0/0` (or tighten later) |
| **Render** | Pause/delete `swappy-api` after ECS is healthy |

Confirm:

```text
GET https://<BACKEND_URL>/health
GET https://<BACKEND_URL>/api/v1/auth/social/providers
```

---

## 5. What Amplify *can* be used for later

Only if you want to leave Vercel: Amplify Hosting for **`apps/web`** (Next.js), with:

- App root / monorepo path: `apps/web`
- Build: `npm ci && npm run build`
- Output: Amplify’s Next.js SSR settings (not a static `out/` folder unless you export)

That is a **frontend** move, separate from the API. Keep the API on ECS Express Mode.

---

## 6. Stability before “scale”

Hosting won’t fix pitch bugs. After the API is healthy on ECS:

1. List the embarrassing failures from the demo (login, upload, scoring, trends, mobile, cold start).
2. Fix those on `main` with small commits.
3. Then raise ECS min tasks / autoscaling and tighten secrets (Secrets Manager).
