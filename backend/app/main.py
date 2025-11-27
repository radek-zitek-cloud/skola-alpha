import time

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

app = FastAPI(title="skola-alpha API", version="0.1.0")

# Create database tables
Base.metadata.create_all(bind=engine)

# Store application start time for uptime calculation
_start_time = time.time()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
