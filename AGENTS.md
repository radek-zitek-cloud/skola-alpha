# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: Python service code; create an app package (e.g., `backend/app`) and keep tests in `backend/tests`.
- `frontend/`: Web UI code; keep source in `frontend/src` and static assets in `frontend/public`. Place UI tests alongside components.
- `docker-compose.yml`: For local orchestration once services exist; align service names with directories.
- Update `README.md` and `GEMINI.md` whenever commands or architecture change.

## Build, Test, and Development Commands
- Backend setup (uv preferred): `cd backend && uv venv && source .venv/bin/activate && uv pip install -r requirements.txt`.
- Backend tests: `cd backend && source .venv/bin/activate && uv run pytest`. Pin dependencies in `requirements.txt` and regenerate via `uv pip compile` when you change them.
- Frontend setup/run (after scaffolding): `cd frontend && npm install && npm run dev`; build with `npm run build`.
- Record new scripts or compose services in the README so others can reproduce runs.

## Coding Style & Naming Conventions
- Python: PEP 8, 4-space indents, snake_case. Prefer type hints and docstrings on public functions. Use Black/Ruff if configured.
- Frontend: favor TypeScript; camelCase for vars/functions, PascalCase for components/files. Keep components small and colocate styles/tests.
- Descriptive filenames (e.g., `study_plan_service.py`, `ProgressTracker.tsx`); avoid generic names.

## Testing Guidelines
- Backend tests live in `backend/tests` using `test_*.py`; cover happy paths and validation/error branches with fixtures.
- Frontend tests (Vitest/Jest) mirror component structure with `*.test.ts[x]`. Snapshot only stable UI; prefer behavior-driven queries.
- In PRs, list tests run and any known gaps.

## Commit & Pull Request Guidelines
- Commits: concise, present-tense subjects; group logical units. Example: `feat: add study plan model` or `fix: handle empty progress list`.
- PRs: include a summary, linked issue, steps to verify, tests run, and screenshots/GIFs for UI changes. Note follow-ups. Keep scope small.

## Security & Configuration Tips
- Do not commit secrets; use `.env` (gitignored) and share `.env.example` defaults. Rotate demo keys.
- For databases/APIs, use env vars and track migrations (e.g., Alembic) in `backend/migrations`.
- Sanitize logs and avoid persisting PII; redact sensitive fields in responses.
