# Backend (FastAPI) v0.0.1

## Quick start

1. Install uv (`pip install uv` if not already).
2. Create env and install deps:

```bash
cd backend
uv venv
source .venv/bin/activate
uv pip install -e .
```

3. Run locally (CORS open to Vite dev at 5173):

```bash
uv run uvicorn app.main:app --reload --host localhost --port 8000
```

## Tests

- Run unit tests: `uv run pytest`

### Endpoints

- `GET /health` — readiness probe returning `{"status": "ok"}`.
- `GET /metrics` — Prometheus text format.
- `GET /docs` — Swagger UI provided by FastAPI.
