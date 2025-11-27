# Skola Alpha v0.0.1

[![Backend CI](https://github.com/radek-zitek-cloud/skola-alpha/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/radek-zitek-cloud/skola-alpha/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/radek-zitek-cloud/skola-alpha/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/radek-zitek-cloud/skola-alpha/actions/workflows/frontend-ci.yml)

Web app with a FastAPI backend and React/Vite frontend.

## Getting Started

### Backend

```bash
cd backend
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv sync --all-extras
uv run uvicorn app.main:app --reload --host localhost --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL` if backend is not on `localhost:8000`.

### Health Check

- Visit `http://localhost:8000/health`
- Swagger API docs at `http://localhost:8000/docs`
- Prometheus metrics at `http://localhost:8000/metrics`

## Testing

### Backend

```bash
cd backend
uv run pytest                    # Run tests
uv run pytest --cov=app         # Run tests with coverage
```

### Frontend

```bash
cd frontend
npm test                         # Run tests
npm test -- --coverage          # Run tests with coverage
```

## Code Quality

### Backend

```bash
cd backend
uv run black app tests          # Format code
uv run ruff check app tests     # Lint code
uv run flake8 app tests         # Additional linting
```

### Frontend

```bash
cd frontend
npm run lint                     # Lint code
npm run lint:fix                # Auto-fix linting issues
npm run format                  # Format code with Prettier
npm run format:check            # Check formatting
```

## CI/CD

This project uses GitHub Actions for continuous integration:

- **Backend CI**: Runs linting (Flake8, Black, Ruff), tests, and coverage reports
- **Frontend CI**: Runs linting (ESLint), formatting (Prettier), type checking (TypeScript), tests, and builds
- **Combined CI**: Orchestrates all checks and reports overall status

All CI checks run automatically on:
- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to `main` or `develop` branches

## Documentation

- [`docs/AGENTS.md`](docs/AGENTS.md) - Contributor guidelines and project conventions
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - Detailed architecture documentation
- [`docs/AUTHENTICATION_ARCHITECTURE.md`](docs/AUTHENTICATION_ARCHITECTURE.md) - Authentication system architecture
- [`docs/GOOGLE_OAUTH_SETUP.md`](docs/GOOGLE_OAUTH_SETUP.md) - **Google OAuth2 setup guide (required for login)**
- [`docs/CI_CD_GUIDE.md`](docs/CI_CD_GUIDE.md) - CI/CD workflow guide for newcomers
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) - Project change history
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) - Contributing guidelines
- [`docs/CODE_REVIEW_SUMMARY.md`](docs/CODE_REVIEW_SUMMARY.md) - Code review summary

## Environment Configuration

The application requires environment variables to be configured for proper operation.

**Backend `.env` file has been created** from the template, but you need to add your Google OAuth credentials:

1. Follow the **[Google OAuth Setup Guide](docs/GOOGLE_OAUTH_SETUP.md)** to obtain credentials
2. Edit `backend/.env` and add your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Frontend: `cp frontend/.env.example frontend/.env` and add the same `GOOGLE_CLIENT_ID`

See the `.env.example` files for all available configuration options.

## Project Structure

```
skola-alpha/
├── backend/          # FastAPI Python service
│   ├── app/         # Application code
│   └── tests/       # Backend tests
├── frontend/        # React/Vite frontend
│   └── src/         # Frontend source code
├── docs/            # Documentation
└── .github/         # GitHub workflows and templates
```

## Notes

- Default dev DB: sqlite3 (placeholder; not yet wired)
- Build tools: uv (Python), Vite (frontend)
- See `docs/AGENTS.md` for detailed contributor guidance
  