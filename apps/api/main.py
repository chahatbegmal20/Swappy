import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from apps.api.core.config import settings
from apps.api.core.database import init_db
from apps.api.routers import auth, dashboard, projects, scoring, trends, uploads
from apps.api.services.trend_service import seed_demo_trends


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_demo_trends()
    yield


app = FastAPI(
    title="Swappy API",
    description="Creator Market Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins = {settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"}
for origin in os.getenv("CORS_ALLOW_ORIGINS", "").split(","):
    candidate = origin.strip()
    if candidate:
        cors_origins.add(candidate)

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(cors_origins),
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?",
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


@app.get("/auth/callback")
async def oauth_frontend_callback_fallback(request: Request):
    """If a client lands on the API /auth/callback, bounce them to the Next.js app."""
    from fastapi.responses import RedirectResponse

    query = request.url.query
    target = f"{settings.FRONTEND_URL.rstrip('/')}/auth/callback"
    if query:
        target = f"{target}?{query}"
    return RedirectResponse(url=target, status_code=302)


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
