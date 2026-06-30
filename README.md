# Swappy — Creator Market Intelligence Platform

AI-powered market intelligence that helps content creators predict trends, analyze competition, and maximize content impact before publishing. Upload your content drafts — video, audio, thumbnails, or text — and receive predictive scores, explainable insights, and actionable recommendations powered by machine learning.

## Features

- **Content Analysis** — Upload video, audio, thumbnails, and text. The ML pipeline extracts features and returns a full scoring report within seconds.
- **7 Predictive Scores** — Trend Alignment, Virality Probability, Audience Fit, Novelty, Competitiveness, Launch Timing, and Trend Creation potential.
- **Trend Intelligence** — Real-time trend monitoring with heatmaps, trajectory tracking, and filtering by category, region, and signal type.
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
        │ PostgreSQL │ │  Redis  │ │ MinIO (S3)  │
        │   :5432    │ │  :6379  │ │ :9000/:9001 │
        └───────────┘ └────┬────┘ └─────────────┘
                           │
                     ┌─────▼─────┐
                     │  Celery   │
                     │  Worker   │
                     └───────────┘
```

The **frontend** (Next.js) communicates with the **API** (FastAPI) over REST. The API handles auth, project CRUD, file uploads (to MinIO/S3), and synchronous scoring. For heavy workloads — batch analysis, trend ingestion, media processing — the API dispatches tasks to **Celery workers** backed by **Redis**. All persistent state lives in **PostgreSQL**, with **Alembic** managing schema migrations.

## Tech Stack

### Frontend
- **Next.js 16** with App Router, TypeScript, Tailwind CSS
- **Zustand** for client state, **TanStack Query** for server state
- **Recharts** for data visualization, **Lucide React** for icons

### Backend
- **FastAPI** with async SQLAlchemy and Pydantic v2
- **Celery + Redis** for distributed task processing
- **boto3** for S3-compatible object storage (MinIO in dev)

### ML / AI
- **scikit-learn**, **XGBoost** — scoring models
- **NumPy**, **pandas** — feature engineering
- **sentence-transformers**, **CLIP** — embedding extraction (production)
- **SHAP** — model explainability
- **librosa**, **Pillow** — audio and image feature extraction

### Infrastructure
- **PostgreSQL 16** — relational data store
- **Redis 7** — task broker, caching, result backend
- **MinIO** — S3-compatible object storage for uploads
- **Docker + Docker Compose** — containerized development and deployment
- **Alembic** — database migrations

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+

### 1. Start Infrastructure

```bash
cd Swappy
docker-compose up -d
```

This starts PostgreSQL, Redis, and MinIO (with automatic bucket creation).

### 2. Backend Setup

```bash
python -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -e .
```

### 3. Database (MongoDB)

No migrations are required. The app uses **MongoDB** via the **Beanie** ODM and
creates collections and indexes automatically on startup. Just set your
connection string in `.env`:

```bash
DATABASE_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/
MONGO_DB_NAME=swappy
```

### 4. Start the API

```bash
uvicorn apps.api.main:app --reload --port 8000
```

### 5. Start a Celery Worker (optional, for async tasks)

```bash
celery -A apps.worker.tasks worker --loglevel=info
```

### 6. Frontend Setup (new terminal)

```bash
cd apps/web
npm install
npm run dev
```

### Access Points

| Service        | URL                          |
|----------------|------------------------------|
| Frontend       | http://localhost:3000         |
| API            | http://localhost:8000         |
| API Docs       | http://localhost:8000/docs    |
| MinIO Console  | http://localhost:9001         |

Default MinIO credentials: `minioadmin` / `minioadmin`

## Project Structure

```
Swappy/
├── apps/
│   ├── api/                        # FastAPI backend
│   │   ├── core/                   # Config, database, security, storage
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── security.py
│   │   │   └── storage.py
│   │   ├── models/                 # SQLAlchemy models + Pydantic schemas
│   │   │   ├── database.py
│   │   │   └── schemas.py
│   │   ├── routers/                # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── dashboard.py
│   │   │   ├── projects.py
│   │   │   ├── scoring.py
│   │   │   ├── trends.py
│   │   │   └── uploads.py
│   │   ├── services/               # Business logic
│   │   │   ├── scoring_engine.py
│   │   │   └── trend_service.py
│   │   ├── __init__.py
│   │   └── main.py
│   ├── web/                        # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/                # App Router pages
│   │   │   │   ├── auth/           # Login & register
│   │   │   │   ├── dashboard/      # Dashboard + new project modal
│   │   │   │   ├── project/[id]/   # Project detail with scores
│   │   │   │   ├── settings/       # User settings
│   │   │   │   ├── trends/         # Trend explorer + topic detail
│   │   │   │   ├── upload/         # File upload with dropzone
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx        # Landing page
│   │   │   ├── components/         # Shared UI components
│   │   │   └── lib/                # API client, store, providers, utils
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── worker/                     # Celery async workers
│       ├── __init__.py
│       └── tasks.py
├── data/
│   └── pipelines/
│       └── trend_pipeline.py       # Standalone trend processing scripts
├── packages/
│   └── db/
│       ├── alembic.ini
│       └── migrations/             # Alembic migration scripts
│           ├── env.py
│           └── script.py.mako
├── services/                       # Shared ML & data services
│   ├── feature_engine/
│   │   ├── metadata_features.py    # Platform, audience, timing features
│   │   └── text_features.py        # NLP features, embeddings
│   ├── ml_inference/
│   │   ├── explainer.py            # SHAP explanations & recommendations
│   │   ├── pipeline.py             # End-to-end scoring orchestrator
│   │   └── scorer.py               # Model loading & prediction
│   └── trend_ingestion/
│       ├── processor.py            # Trend normalization & quality checks
│       └── sources.py              # Trend data sources (synthetic + live)
├── infra/
│   └── docker/
│       ├── Dockerfile.api          # API container
│       ├── Dockerfile.web          # Frontend multi-stage build
│       └── Dockerfile.worker       # Celery worker container
├── .env                            # Local environment variables
├── .env.example                    # Environment template
├── docker-compose.yml              # Infrastructure services
├── pyproject.toml                  # Python project config & dependencies
└── package.json                    # Root JS workspace config
```

## API Endpoints

### Authentication
- `POST /auth/register` — Create a new account
- `POST /auth/login` — Authenticate and receive JWT token
- `GET /auth/me` — Get current user profile

### Projects
- `POST /projects/` — Create a new project
- `GET /projects/` — List user's projects
- `GET /projects/{id}` — Get project details with uploads

### Uploads
- `POST /uploads/` — Upload a file (video, audio, thumbnail, text) to a project

### Scoring
- `POST /scoring/analyze` — Run ML analysis on a project
- `GET /scoring/{project_id}/scores` — Get all scores for a project
- `GET /scoring/{project_id}/latest` — Get the most recent score

### Trends
- `GET /trends/` — List trends (filterable by category, region, signal type)
- `GET /trends/search?q=` — Full-text trend search
- `GET /trends/heatmap` — Trend intensity heatmap data
- `GET /trends/{topic}/trajectory` — Historical trajectory for a trend topic

### Dashboard
- `GET /dashboard/stats` — Aggregated user statistics

### System
- `GET /health` — Health check
- `GET /` — API info

## Scoring System

Every project receives **7 predictive scores** (0–100), each with explanations and recommendations:

| Score | What It Measures |
|-------|-----------------|
| **Trend Alignment** | How well the content matches current trending topics and audience interests |
| **Virality Probability** | Likelihood of organic sharing and algorithmic amplification |
| **Audience Fit** | Match between content attributes and the target audience segment |
| **Novelty** | Uniqueness relative to existing content in the same category |
| **Competitiveness** | Ability to stand out against similar content from other creators |
| **Launch Timing** | Whether the planned publish time aligns with peak engagement windows |
| **Trend Creation** | Potential for this content to start a new trend rather than follow one |

An **Overall Viability** score aggregates all seven dimensions into a single confidence metric. Each score is accompanied by:

- **Explanations** — Which factors contributed most to the score
- **Recommendations** — Specific actions to improve each dimension
- **Comparable Examples** — Similar content that performed well
- **Best Publish Window** — Optimal day and time to publish
- **Best Platforms** — Ranked platforms where the content will perform best

## Development

### Running Tests

```bash
# Python tests
pytest

# Frontend tests
cd apps/web && npm test
```

### Linting & Formatting

```bash
# Python
ruff check .
ruff format .

# Frontend
cd apps/web && npm run lint
```

### Adding a New Trend Source

1. Create a new class in `services/trend_ingestion/sources.py` implementing the source interface
2. Add the source to the `TrendProcessor` in `services/trend_ingestion/processor.py`
3. Register a Celery beat schedule in `apps/worker/tasks.py` if it should run on a timer

### Modifying Scoring Models

1. Update feature extraction in `services/feature_engine/`
2. Adjust scoring logic in `services/ml_inference/scorer.py`
3. Update explanations in `services/ml_inference/explainer.py`
4. Bump `MODEL_VERSION` in `services/ml_inference/pipeline.py`

### Environment Variables

Copy `.env.example` to `.env` and adjust values as needed. See the file for all available configuration options. The frontend reads `NEXT_PUBLIC_API_URL` from `apps/web/.env.local`.

## License

MIT
