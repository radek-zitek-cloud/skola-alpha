import logging
import time
from pathlib import Path

import os

from dotenv import load_dotenv

# Load environment variables from .env file BEFORE importing app modules
# This ensures all modules can access env vars when they're imported
env_path = Path(__file__).parent.parent / ".env"
print(f"Loading .env from: {env_path}")
print(f".env file exists: {env_path.exists()}")
load_dotenv(dotenv_path=env_path)
print(f"GOOGLE_CLIENT_ID after load: {os.getenv('GOOGLE_CLIENT_ID', 'NOT SET')[:20] if os.getenv('GOOGLE_CLIENT_ID') else 'NOT SET'}...")
print(f"GOOGLE_CLIENT_SECRET after load: {os.getenv('GOOGLE_CLIENT_SECRET', 'NOT SET')[:20] if os.getenv('GOOGLE_CLIENT_SECRET') else 'NOT SET'}...")

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    Gauge,
    generate_latest,
)

from app.database import Base, engine
from app.routers import router

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="skola-alpha API", version="0.1.0")

# Create database tables
Base.metadata.create_all(bind=engine)

# Store application start time for uptime calculation
_start_time = time.time()


def _load_cors_origins() -> list[str]:
    """Parse CORS origins from env (comma separated) with sensible defaults."""

    raw_origins = os.getenv("CORS_ORIGINS")
    if not raw_origins:
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    origins: list[str] = []
    for origin in raw_origins.split(","):
        cleaned = origin.strip()
        if cleaned:
            origins.append(cleaned.rstrip("/"))

    return origins or ["http://localhost:5173", "http://127.0.0.1:5173"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_load_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication router
app.include_router(router)

# Create Prometheus registry and metrics at module level so they persist across requests
_metrics_registry = CollectorRegistry()
_uptime_gauge = Gauge(
    "app_uptime_seconds",
    "Application uptime in seconds",
    registry=_metrics_registry,
)


@app.get("/health", tags=["ops"])
def health():
    """Lightweight readiness check."""
    return {"status": "ok"}


@app.get("/metrics", tags=["ops"])
def metrics():
    """Expose Prometheus metrics with a simple uptime gauge."""
    _uptime_gauge.set(time.time() - _start_time)
    payload = generate_latest(_metrics_registry)
    return Response(content=payload, media_type=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
