# CI/CD Workflow Guide

This guide explains the Continuous Integration and Continuous Deployment (CI/CD) workflow for the Skola Alpha project. It's designed for developers new to CI/CD, GitHub Actions, and the specific workflows in this repository.

## Table of Contents

1. [What is CI/CD?](#what-is-cicd)
2. [GitHub Actions Overview](#github-actions-overview)
3. [Our Workflow Structure](#our-workflow-structure)
4. [Backend CI Workflow](#backend-ci-workflow)
5. [Frontend CI Workflow](#frontend-ci-workflow)
6. [Combined CI Workflow](#combined-ci-workflow)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)
8. [Running CI Checks Locally](#running-ci-checks-locally)

---

## What is CI/CD?

**CI/CD** stands for **Continuous Integration** and **Continuous Deployment/Delivery**:

- **Continuous Integration (CI)**: Automatically running tests, linting, and builds whenever code is pushed to the repository. This catches bugs and issues early.

- **Continuous Deployment/Delivery (CD)**: Automatically deploying code to production (or staging) environments after passing CI checks.

This project currently implements **CI** (automated testing and building). CD can be added in the future for automatic deployments.

---

## GitHub Actions Overview

**GitHub Actions** is GitHub's built-in automation platform. Key concepts:

### Workflows
YAML files in `.github/workflows/` that define automation pipelines. Each workflow can have multiple jobs.

### Jobs
A job is a set of steps that execute on the same runner (virtual machine). Jobs can run in parallel or sequentially.

### Steps
Individual tasks within a job, like checking out code, installing dependencies, or running tests.

### Triggers
Events that start a workflow, such as:
- `push`: When code is pushed to a branch
- `pull_request`: When a PR is opened or updated
- `schedule`: At scheduled times (cron)

### Runners
Virtual machines that execute jobs. GitHub provides hosted runners (Ubuntu, Windows, macOS) for free.

---

## Our Workflow Structure

We have three workflow files:

```
.github/workflows/
├── backend-ci.yml   # Python/FastAPI backend checks
├── frontend-ci.yml  # React/TypeScript frontend checks
└── ci.yml           # Orchestrates both workflows
```

### When Workflows Run

All workflows trigger on:
- **Push** to `main`, `develop`, or `claude/**` branches
- **Pull requests** to `main` or `develop` branches

Individual backend/frontend workflows only run when their respective directories change (using `paths` filters).

---

## Backend CI Workflow

**File:** `.github/workflows/backend-ci.yml`

### What It Does

1. **Lint and Format Check** job:
   - Runs Flake8 (style checking)
   - Checks Black formatting
   - Runs Ruff linter

2. **Test** job:
   - Runs pytest with verbose output
   - Generates coverage reports
   - Uploads coverage as artifact

### Key Configuration

```yaml
defaults:
  run:
    working-directory: backend  # All commands run in backend/
```

### Dependencies

Uses `uv` (fast Python package manager):
```yaml
- name: Install uv
  uses: astral-sh/setup-uv@v5

- name: Install dependencies
  run: uv sync --all-extras
```

### Running Backend CI Locally

```bash
cd backend

# Install dependencies
uv sync --all-extras

# Run linting (these may show warnings but continue in CI)
uv run flake8 app tests
uv run black --check app tests
uv run ruff check app tests

# Run tests
uv run pytest -v --tb=short

# Run tests with coverage
uv run pytest --cov=app --cov-report=term
```

---

## Frontend CI Workflow

**File:** `.github/workflows/frontend-ci.yml`

### What It Does

1. **Lint and Format Check** job:
   - Runs ESLint for code quality
   - Checks Prettier formatting
   - Runs TypeScript type checking

2. **Test** job:
   - Runs Vitest tests
   - Generates coverage reports

3. **Build** job:
   - Compiles TypeScript
   - Creates production bundle with Vite
   - Uploads build artifacts

### Key Configuration

```yaml
defaults:
  run:
    working-directory: frontend  # All commands run in frontend/

env:
  VITE_API_BASE_URL: http://localhost:8000  # For build
```

### Dependencies

Uses Node.js with npm:
```yaml
- name: Set up Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: frontend/package-lock.json

- name: Install dependencies
  run: npm ci  # Clean install from lock file
```

### Running Frontend CI Locally

```bash
cd frontend

# Install dependencies
npm ci

# Run linting
npm run lint

# Check formatting
npm run format:check

# Type check
npx tsc --noEmit

# Run tests
npm test

# Build
npm run build
```

---

## Combined CI Workflow

**File:** `.github/workflows/ci.yml`

### What It Does

Orchestrates backend and frontend workflows and provides a single status check:

```yaml
jobs:
  backend-ci:
    uses: ./.github/workflows/backend-ci.yml  # Reusable workflow

  frontend-ci:
    uses: ./.github/workflows/frontend-ci.yml  # Reusable workflow

  all-checks:
    needs: [backend-ci, frontend-ci]
    # Checks if all jobs passed or were skipped appropriately
```

### Smart Skipping

The workflow uses conditional logic:
- Backend CI only runs if `backend/` files changed
- Frontend CI only runs if `frontend/` files changed
- Pull requests always run both

---

## Troubleshooting Common Issues

### Backend: "ModuleNotFoundError: No module named 'app'"

**Cause:** pytest can't find the app module.

**Solution:** Ensure `pythonpath` is set in `pyproject.toml`:
```toml
[tool.pytest.ini_options]
pythonpath = ["."]
```

### Frontend: "ERESOLVE unable to resolve dependency tree"

**Cause:** Package version conflicts (usually ESLint + TypeScript ESLint versions).

**Solution:** Ensure compatible versions in `package.json`:
```json
{
  "devDependencies": {
    "eslint": "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0"
  }
}
```

### Frontend: "Cannot find name 'describe'" in tests

**Cause:** TypeScript doesn't recognize Vitest globals.

**Solution:** Add vitest types to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

### Workflow Not Running

**Possible causes:**
1. Branch not in trigger list (`main`, `develop`, `claude/**`)
2. Path filter excluding your changes
3. Syntax error in workflow file

**Debug:** Check the Actions tab on GitHub for workflow runs and error details.

---

## Running CI Checks Locally

Before pushing, run these checks locally to catch issues early:

### Quick Check Script

Create a script or run manually:

```bash
#!/bin/bash
# Run all CI checks locally

echo "=== Backend Checks ==="
cd backend
uv sync --all-extras
uv run flake8 app tests
uv run black --check app tests
uv run ruff check app tests
uv run pytest -v --tb=short
cd ..

echo "=== Frontend Checks ==="
cd frontend
npm ci
npm run lint
npm run format:check
npx tsc --noEmit
npm test
npm run build
cd ..

echo "=== All checks complete! ==="
```

### Using Pre-commit Hooks (Optional)

You can set up pre-commit hooks to run checks automatically before each commit:

1. Install pre-commit: `pip install pre-commit`
2. Create `.pre-commit-config.yaml` in repository root
3. Run `pre-commit install`

---

## Artifacts and Reports

Both workflows upload artifacts that persist after the run:

| Artifact | Description | Retention |
|----------|-------------|-----------|
| `coverage-report` | Backend test coverage (XML) | 30 days |
| `frontend-coverage-report` | Frontend test coverage | 30 days |
| `frontend-build` | Production build files | 7 days |

Download artifacts from the GitHub Actions run summary page.

---

## Best Practices

1. **Fix locally first**: Run CI checks locally before pushing
2. **Small commits**: Easier to debug when CI fails
3. **Read the logs**: GitHub Actions provides detailed logs for each step
4. **Don't skip CI**: Avoid using `[skip ci]` in commits unless necessary
5. **Keep dependencies updated**: Outdated packages can cause compatibility issues

---

## Next Steps for CD

To add Continuous Deployment:

1. Add deployment jobs to workflows
2. Set up environment secrets (API keys, deployment tokens)
3. Configure deployment targets (cloud hosting, servers)
4. Add environment protection rules in GitHub

---

## Getting Help

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Project Issues**: Open an issue in the repository
- **Workflow Logs**: Check the Actions tab for detailed error messages
