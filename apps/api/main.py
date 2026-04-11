from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from apps.api.core.config import settings
from apps.api.core.database import init_db
from apps.api.routers import auth, dashboard, projects, scoring, trends, uploads
from apps.api.services.trend_service import seed_demo_trends
from apps.api.core.database import async_session


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    async with async_session() as session:
        await seed_demo_trends(session)
        await session.commit()
    yield


app = FastAPI(
    title="Swappy API",
    description="Creator Market Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(uploads.router, prefix=API_PREFIX)
app.include_router(projects.router, prefix=API_PREFIX)
app.include_router(scoring.router, prefix=API_PREFIX)
app.include_router(trends.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/")
async def root():
    return {"message": "Swappy API", "version": "1.0.0"}


@app.put("/mock-upload/{path:path}")
async def mock_upload(path: str, request: Request):
    """Accepts file uploads when S3/MinIO is not available and saves to local disk."""
    import os
    local_dir = os.path.join("local_uploads", os.path.dirname(path))
    os.makedirs(local_dir, exist_ok=True)
    local_path = os.path.join("local_uploads", path)
    body = await request.body()
    with open(local_path, "wb") as f:
        f.write(body)
    return {"status": "ok", "path": path, "local_path": local_path}
