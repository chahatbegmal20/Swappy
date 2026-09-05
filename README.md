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

