# Swappy — Creator Market Intelligence Platform

AI-powered market intelligence that helps content creators predict trends, analyze competition, and maximize content impact before publishing. Upload your content drafts — video, audio, thumbnails, or text — and receive predictive scores, explainable insights, and actionable recommendations powered by machine learning.

## Features

- **Content Analysis** — Upload video, audio, thumbnails, and text. The ML pipeline extracts features and returns a full scoring report within seconds.
- **7 Predictive Scores** — Trend Alignment, Virality Probability, Audience Fit, Novelty, Competitiveness, Launch Timing, and Trend Creation potential.
- **Trend Intelligence** — Live trend monitoring with engagement estimates, predicted trend score, velocity, and trajectory.
- **Explainable AI** — Every score comes with plain-language explanations, factor breakdowns, comparable examples, and concrete recommendations.
- **Creator Dashboard** — Track project performance over time, compare draft iterations side-by-side, and explore market opportunities.
- **Optimal Publish Timing** — Get recommended publish windows and best-fit platforms for each piece of content.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Next.js    │────▶│   FastAPI     │────▶│  ML Pipeline    │
│   Frontend   │◀────│   REST API   │◀────│  (Scoring +     │
│   :3000      │     │   :8000      │     │   Explainability)│
└──────────────┘     └──────┬───────┘     └─────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
        ┌─────▼─────┐ ┌────▼────┐ ┌──────▼──────┐
        │ MongoDB   │ │  Redis  │ │ MinIO / R2  │
        │  Atlas    │ │  :6379  │ │   (S3 API)  │
        └───────────┘ └────┬────┘ └─────────────┘
                           │
                     ┌─────▼─────┐
                     │  Celery   │
                     │  Worker   │
                     └───────────┘
```

The **frontend** (Next.js in `apps/web`) talks to the **API** (FastAPI in `apps/api`) over REST. The API handles auth, project CRUD, file uploads (S3-compatible storage), trends, and scoring. Heavy jobs can go to **Celery** via **Redis**. Persistent state lives in **MongoDB Atlas** (Beanie ODM).

## Tech Stack

### Frontend
- **Next.js 16** (App Router), TypeScript, Tailwind CSS
- **Zustand** + **TanStack Query**, **Recharts**, **Lucide**

### Backend
- **FastAPI** + **Pydantic v2** + **Beanie / Motor** (MongoDB)
- **Celery + Redis** for background work (optional early on)
- **boto3** for S3-compatible object storage (MinIO local, R2/S3 in cloud)

### ML / AI
- **scikit-learn**, **XGBoost**, **NumPy**, **pandas**
- **sentence-transformers**, **SHAP**, **librosa**, **Pillow**

### Infrastructure (early stage)
- **Local:** `npm run start` + Atlas + mock/MinIO uploads
- **Staging/Prod:** Vercel (web) + Railway (API) + Atlas + Cloudflare R2
- See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Environments & branching

| Concern | Approach |
|---------|----------|
| Git | Feature branch → PR → `main` (no long-lived env branches) |
| Runtime | Separate **staging** and **production** deploys + secrets |
| Config | `.env` / host env vars — see `.env.example`, `.env.staging.example`, `.env.production.example` |

Promote: merge to `main` → verify staging → promote the same commit to production.

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- MongoDB Atlas connection string (or local Mongo)
- Optional: Docker Desktop for Redis/MinIO (`docker compose up -d`)

### Setup

```bash
# 1) Python env
python -m venv .venv
# Windows
.\.venv\Scripts\Activate.ps1
pip install -e .

# 2) Env file
copy .env.example .env   # then fill DATABASE_URL, JWT_SECRET, OAuth, etc.

# 3) Web deps
cd apps/web
npm ci
cd ../..

# 4) Run API + web
npm install
npm run start
```

- Web: http://localhost:3000  
- API: http://127.0.0.1:8000/health  
- Docs: http://127.0.0.1:8000/docs (disabled when `APP_ENV=production`)

### Manual / console setup

OAuth consoles, SMS, Atlas network access: [docs/MANUAL_SETUP_GUIDE.md](docs/MANUAL_SETUP_GUIDE.md)

### Deploy

Step-by-step Vercel + Railway + Atlas + R2: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Repo layout

```
apps/api          FastAPI application
apps/web          Next.js frontend (part of this monorepo)
apps/worker       Celery tasks
services/         Trend ingestion and shared services
infra/docker/     API / web / worker Dockerfiles
docs/             Manual setup + deployment guides
.github/workflows CI (API tests + web build)
```

## License

Proprietary — all rights reserved.
