from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    Gauge,
    generate_latest,
)

app = FastAPI(title="skola-alpha API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["ops"])
def health():
    """Lightweight readiness check."""
    return {"status": "ok"}


@app.get("/metrics", tags=["ops"])
def metrics():
    """Expose Prometheus metrics with a simple uptime gauge."""
    registry = CollectorRegistry()
    uptime = Gauge(
        "app_uptime_seconds",
        "Application uptime in seconds",
        registry=registry,
    )
    uptime.set_to_current_time()
    payload = generate_latest(registry)
    return Response(content=payload, media_type=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
