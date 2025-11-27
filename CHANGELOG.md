# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive GitHub Actions CI/CD pipeline
  - Backend CI workflow with linting, formatting, and testing
  - Frontend CI workflow with linting, formatting, type checking, and building
  - Combined CI workflow orchestrating all checks
- Code quality tools configuration
  - ESLint and Prettier for TypeScript/React frontend
  - Black, Ruff, and Flake8 for Python backend
  - pytest configuration in pyproject.toml
- Environment variable documentation
  - Backend .env.example with all configuration options
  - Frontend .env.example with API and app settings
- GitHub templates
  - Pull request template with comprehensive checklist
  - Bug report issue template
  - Feature request issue template
- CHANGELOG.md for tracking project changes

### Changed

- Fixed duplicate `_start_time` initialization in backend/app/main.py
- Fixed metrics endpoint to reuse module-level Prometheus registry instead of creating new one per request
- Updated frontend package.json with linting and formatting scripts
- Updated backend pyproject.toml with dev dependencies for code quality tools

### Removed

- Temporary documentation files (TEMP.md, GEMINI.md)

## [0.0.1] - 2024-01-XX

### Added

- Initial project structure with FastAPI backend and React frontend
- Basic health check endpoint
- Prometheus metrics endpoint with uptime tracking
- Frontend status dashboard with backend connectivity check
- Backend and frontend test suites
- Project documentation (README, ARCHITECTURE, AGENTS)
- Docker and docker-compose placeholders
- MIT License

[Unreleased]: https://github.com/radek-zitek-cloud/skola-alpha/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/radek-zitek-cloud/skola-alpha/releases/tag/v0.0.1
