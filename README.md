# Skola Alpha v0.0.1

Web app with a FastAPI backend and React/Vite frontend.

## Getting Started

- Backend: `cd backend && uv venv && source .venv/bin/activate && uv pip install -e . && uv run uvicorn app.main:app --reload --host localhost --port 8000`
- Frontend: `cd frontend && npm install && npm run dev` (set `VITE_API_BASE_URL` if backend not on `localhost:8000`)
- Health: visit `http://localhost:8000/health` or Swagger at `/docs`.

## Testing

- Backend: `cd backend && uv run pytest`
- Frontend: `cd frontend && npm test`

## Notes

- Default dev DB: sqlite3 (placeholder; not yet wired).
- Build tools: uv (Python), Vite (frontend). See `AGENTS.md` for contributor guidance.
  