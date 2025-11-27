# Contributing to Skola Alpha

Thank you for your interest in contributing to Skola Alpha! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue Guidelines](#issue-guidelines)

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/skola-alpha.git
   cd skola-alpha
   ```
3. **Set up the development environment**:
   - Backend: See [backend/README.md](backend/README.md)
   - Frontend: See [frontend/README.md](frontend/README.md)
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Backend Development

1. Install dependencies:
   ```bash
   cd backend
   uv sync --all-extras
   ```

2. Make your changes to the code

3. Run code quality checks:
   ```bash
   uv run black app tests          # Format code
   uv run ruff check app tests     # Lint code
   uv run flake8 app tests         # Additional linting
   ```

4. Run tests:
   ```bash
   uv run pytest
   uv run pytest --cov=app         # With coverage
   ```

### Frontend Development

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Make your changes to the code

3. Run code quality checks:
   ```bash
   npm run lint                    # Lint code
   npm run format:check            # Check formatting
   npx tsc --noEmit               # Type check
   ```

4. Run tests:
   ```bash
   npm test
   npm test -- --coverage         # With coverage
   ```

## Code Style

### Python (Backend)

- **Line length**: 120 characters (configured in `.flake8` and `pyproject.toml`)
- **Formatter**: Black
- **Linters**: Ruff, Flake8
- **Style guide**: PEP 8

Key conventions:
- Use type hints for function parameters and return values
- Write docstrings for all public functions and classes
- Keep functions focused and small
- Use meaningful variable names
- Follow the existing code structure

### TypeScript/React (Frontend)

- **Line length**: 100 characters (configured in `.prettierrc.json`)
- **Formatter**: Prettier
- **Linter**: ESLint
- **Style**: Strict TypeScript

Key conventions:
- Use functional components with hooks
- Type all props and state
- Use meaningful component and variable names
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use const for all declarations unless reassignment is needed

## Testing

### Writing Tests

- **Backend**: Use pytest for all tests
  - Place tests in `backend/tests/`
  - Name test files `test_*.py`
  - Use descriptive test names that explain what is being tested
  - Use fixtures for common setup
  - Aim for high code coverage

- **Frontend**: Use Vitest and React Testing Library
  - Place tests next to components as `*.test.tsx`
  - Test user interactions, not implementation details
  - Use `screen` queries from Testing Library
  - Mock external dependencies appropriately

### Running Tests

All tests must pass before submitting a PR:

```bash
# Backend
cd backend && uv run pytest

# Frontend
cd frontend && npm test
```

## Submitting Changes

### Commit Messages

Write clear, descriptive commit messages:

```
type: brief description (50 chars or less)

More detailed explanation if needed. Wrap at 72 characters.
Explain the problem this commit solves and why you chose
this solution.

Fixes #123
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Pull Requests

1. **Update your branch** with the latest changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** on GitHub:
   - Use the PR template
   - Provide a clear description of the changes
   - Link related issues
   - Add screenshots for UI changes
   - Ensure all CI checks pass

4. **Code Review**:
   - Address feedback promptly
   - Push additional commits to update the PR
   - Request re-review when ready

### PR Checklist

Before submitting, ensure:

- [ ] Code follows the project's style guidelines
- [ ] All tests pass locally
- [ ] New code has appropriate test coverage
- [ ] Documentation is updated if needed
- [ ] Commit messages are clear and descriptive
- [ ] No commented-out code or debug statements
- [ ] Environment variables are documented in `.env.example` if added

## Issue Guidelines

### Reporting Bugs

Use the bug report template and include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, versions, etc.)
- Screenshots if applicable

### Requesting Features

Use the feature request template and include:
- Clear description of the feature
- Problem it solves
- Proposed solution
- Alternatives considered
- Benefits and potential drawbacks

### Good First Issues

Look for issues labeled `good first issue` if you're new to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Give constructive feedback
- Focus on what is best for the community
- Show empathy towards others

## Questions?

If you have questions:
- Check existing documentation
- Search closed issues and PRs
- Open a new issue with the question label
- Ask in pull request comments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
