## Backend (FastAPI)

### Quick start
1) Install uv (`pip install uv` if not already).
2) Create env and install deps:
```bash
cd backend
uv venv
source .venv/bin/activate
uv pip install -e .
```
3) Run locally:
```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Endpoints
- `GET /health` — readiness probe returning `{"status": "ok"}`.
- `GET /metrics` — Prometheus text format.
- `GET /docs` — Swagger UI provided by FastAPI.
