# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Skola Alpha is a full-stack web application with a FastAPI backend and React/Vite frontend. The project is designed to run locally in terminals for development speed, but deploy via Docker/Traefik for production.

## Development Commands

### Backend (FastAPI)

**Setup:**

```bash
cd backend
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv sync --all-extras
```

**Run server:**

```bash
cd backend
uv run uvicorn app.main:app --reload --host localhost --port 8000
```

**Testing:**

```bash
cd backend
uv run pytest                    # Run all tests
uv run pytest tests/test_health.py  # Run single test file
uv run pytest --cov=app         # With coverage
```

**Testing Guidelines:**

- **NEVER** modify the production database (`skola_alpha.db`) during tests.
- Always use the `client` and `db_session` fixtures provided in `tests/conftest.py`.
- These fixtures ensure tests run against an isolated in-memory SQLite database.
- Do not import `engine` or `SessionLocal` from `app.database` inside test files; use the fixtures instead.

**Code quality:**

```bash
cd backend
uv run black app tests          # Format code
uv run ruff check app tests     # Lint code
uv run flake8 app tests         # Additional linting
```

**Dependencies:**

- Update dependencies in `pyproject.toml`, then run `uv lock` to regenerate the lock file
- Use `uv sync` to install dependencies from the lock file

### Frontend (React/Vite)

**Setup & Run:**

```bash
cd frontend
npm install
npm run dev                      # Development server (default: http://localhost:5173)
```

**Testing:**

```bash
cd frontend
npm test                         # Run tests with Vitest
npm test -- --coverage          # With coverage
```

**Code quality:**

```bash
cd frontend
npm run lint                     # Lint with ESLint
npm run lint:fix                # Auto-fix linting issues
npm run format                  # Format with Prettier
npm run format:check            # Check formatting only
```

**Build:**

```bash
cd frontend
npm run build                    # TypeScript compilation + Vite build
npm run preview                  # Preview production build
```

## Architecture

### Monorepo Structure

This is a monorepo with backend and frontend in separate directories at the root level:

``` shell
skola-alpha/
├── backend/          # FastAPI Python service
│   ├── app/         # Application code (main.py is entry point)
│   └── tests/       # Backend tests
├── frontend/        # React/Vite frontend
│   └── src/         # Frontend source code
├── docs/            # Documentation
└── .github/         # GitHub workflows
```

### Backend Architecture (FastAPI)

**Current state:** Minimal FastAPI app with health check and Prometheus metrics.

**Planned structure** (per docs/ARCHITECTURE.md):

- `app/api/` - Route handlers (endpoints)
- `app/core/` - Config, Security, Database setup
- `app/models/` - SQLAlchemy Database Models
- `app/schemas/` - Pydantic Schemas (Request/Response)
- `app/services/` - Business logic
- `alembic/` - Database migrations (when added)

**Key patterns:**

- Entry point is `app/main.py` with FastAPI app initialization
- CORS configured for `localhost:5173` (Vite default port)
- Prometheus metrics exposed at `/metrics` endpoint
- Health check at `/health` endpoint
- Uses module-level Prometheus registry to persist metrics across requests

### Frontend Architecture (React/Vite)

**Current state:** Single-component app that checks backend health status.

**Planned structure:**

- `src/components/` - React components
- `src/pages/` - Page components
- `src/services/` - API calls (axios/fetch wrappers)
- `src/hooks/` - Custom React hooks
- `src/assets/` - Static assets

**Key patterns:**

- API base URL configured via `VITE_API_BASE_URL` environment variable (defaults to `http://localhost:8000`)
- Uses Vite for fast development and optimized builds
- Testing with Vitest and React Testing Library

### Development vs Production

**Development (Terminal Mode):**

- Backend runs on `localhost:8000` via uvicorn
- Frontend runs on `localhost:5173` via Vite
- Database: SQLite locally or Docker Postgres via `docker-compose.dev.yml`
- CORS allows requests from `localhost:5173`

**Production (Docker Mode):**

- Traefik acts as reverse proxy on ports 80/443
- Backend container accessed via `/api` path prefix
- Frontend container serves static build via Nginx
- Database URL changes from `localhost` to service name (`postgres`)
- Frontend's `VITE_API_BASE_URL` should be public URL (e.g., `/api` or `https://api.domain.com`)

## Coding Standards

### Python (Backend)

- **Style:** PEP 8, 4-space indents, snake_case for variables/functions
- **Line length:** 120 characters (Black/Ruff config)
- **Type hints:** Prefer type hints on public functions
- **Docstrings:** Required on public functions
- **Imports:** Use Ruff's isort; `app` is a known first-party package
- **Testing:** Tests in `backend/tests/` with `test_*.py` naming
- **Target version:** Python 3.12+

### TypeScript/React (Frontend)

- **Naming:** camelCase for vars/functions, PascalCase for components/files
- **Components:** Keep small, colocate styles/tests
- **Testing:** Mirror component structure with `*.test.tsx` naming
- **Prefer:** Behavior-driven queries over snapshots
- **Line length:** Per ESLint config

### General Patterns

- **Descriptive filenames:** e.g., `study_plan_service.py`, `ProgressTracker.tsx`
- **Avoid generic names:** Don't use `utils.py`, `helpers.ts`, etc.

## Testing Guidelines

- **Backend:** Use pytest fixtures; cover happy paths and error branches
- **Frontend:** Use Vitest/React Testing Library; test behavior, not implementation
- **Coverage:** Run with `--cov` flag for backend, `--coverage` for frontend
- List tests run and gaps in PR descriptions

## CI/CD

GitHub Actions workflows run on push to `main`, `develop`, or `claude/**` branches, and on PRs to `main` or `develop`.

**Workflows:**

- `backend-ci.yml` - Linting (Flake8, Black, Ruff), tests, coverage
- `frontend-ci.yml` - Linting (ESLint), formatting (Prettier), type checking, tests, build
- `ci.yml` - Orchestrates both workflows and reports overall status

## Environment Configuration

**Backend:**

- Copy `backend/.env.example` to `backend/.env`
- Configure database URL (switch between `localhost` and Docker service names)
- Use pydantic-settings to load env vars

**Frontend:**

- Copy `frontend/.env.example` to `frontend/.env`
- Set `VITE_API_BASE_URL` if backend is not on `localhost:8000`

## Security & Best Practices

- Never commit secrets; use `.env` files (gitignored)
- Share `.env.example` files with safe defaults
- Sanitize logs; avoid persisting PII
- For databases/APIs, use environment variables
- Track migrations in `backend/migrations` (when using Alembic)

## Git Workflow

**Commits:**

- Concise, present-tense subjects
- Group logical units
- Examples: `feat: add study plan model`, `fix: handle empty progress list`

**Pull Requests:**

- Include summary, linked issue, verification steps
- List tests run and known gaps
- Add screenshots/GIFs for UI changes
- Note follow-ups
- Keep scope small

## Additional Documentation

- `docs/AGENTS.md` - Detailed contributor guidelines and conventions
- `docs/ARCHITECTURE.md` - In-depth architecture documentation
- `docs/CI_CD_GUIDE.md` - CI/CD workflow guide for newcomers
- `docs/CONTRIBUTING.md` - Contributing guidelines
- `docs/CHANGELOG.md` - Project change history
