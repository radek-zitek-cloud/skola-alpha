# Architecture

## Introduction

Here is the recommended folder structure designed to handle your specific requirement: running locally in terminals for speed, but deploying via Docker/Traefik for production.

### The Project Hierarchy

This structure separates concerns while keeping the project unified.

```text
my-project-root/
├── .github/                 # GitHub Actions (CI/CD workflows)
├── .gitignore               # Global gitignore
├── docker-compose.yml       # For running the stack in Docker (Prod/Staging)
├── docker-compose.dev.yml   # Optional: For running infra (DB) only during dev
├── README.md
│
├── backend/                 # FastAPI Project
│   ├── alembic/             # Database migrations
│   ├── alembic.ini
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # Entry point (FastAPI app init)
│   │   ├── api/             # Route handlers (endpoints)
│   │   ├── core/            # Config, Security, Database setup
│   │   ├── models/          # SQLAlchemy Database Models
│   │   ├── schemas/         # Pydantic Schemas (Request/Response)
│   │   └── services/        # Business logic
│   ├── tests/
│   ├── .env                 # Local env variables (gitignored)
│   ├── .env.example         # Template for env vars
│   ├── Dockerfile           # Production Dockerfile for backend
│   ├── pyproject.toml       # Dependencies (Poetry) or requirements.txt
│   └── .dockerignore
│
└── frontend/                # React Project
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── hooks/
    │   ├── pages/
    │   ├── services/        # API calls (axios/fetch wrappers)
    │   ├── App.tsx
    │   └── main.tsx
    ├── .env                 # Frontend env vars (API URL)
    ├── Dockerfile           # Multi-stage Dockerfile (Build -> Nginx)
    ├── nginx.conf           # Config to serve React in Prod
    ├── package.json
    ├── vite.config.ts       # Or webpack/cra config
    └── .dockerignore
```

---

### Detailed Breakdown

#### 1\. The Backend (`/backend`)

We separate the application code (`app/`) from configuration files.

- **Alembic:** Essential for SQLAlchemy. Keep it at the root of `backend/` so it can track migrations easily.
- **app/core/config.py:** Use `pydantic-settings` to load environment variables. This is crucial for switching between Local (localhost) and Docker (container names) database URLs.
- **Dockerfile:** This should be optimized for production (using a non-root user).

#### 2\. The Frontend (`/frontend`)

- **Vite:** I highly recommend using Vite over Create React App for speed.
- **Dockerfile:** This must be a **Multi-stage build**.
  1. **Build Stage:** Node image installs dependencies and runs `npm run build`.
  2. **Serve Stage:** Nginx image copies the build output to `/usr/share/nginx/html`.
- **nginx.conf:** You need a custom config in this folder to handle React Router (Single Page Application routing) so that refreshing a page like `/dashboard` doesn't throw a 404 error in production.

#### 3\. The Infrastructure (Root)

- **Traefik:** You do not need a folder for this. You will define Traefik services and labels directly in `docker-compose.yml`.

---

### How to Handle the "Dev vs. Prod" Workflow

This is the trickiest part of your request. Here is how to configure it so it works seamlessly.

#### 1\. Development (Terminal Mode)

You run the services manually on your host machine.

- **Database:** You usually don't want to install Postgres directly on your Mac/Windows. Use a `docker-compose.dev.yml` just for the database.

  ```bash
  docker-compose -f docker-compose.dev.yml up -d db
  ```

- **Backend:** Run `uvicorn app.main:app --reload` inside `/backend`.
  - _Config:_ Set `.env` DB URL to `localhost`.
- **Frontend:** Run `npm run dev` inside `/frontend`.
  - _Config:_ Set `.env` API URL to `http://localhost:8000`.
- **CORS:** In `backend/app/main.py`, you must add `CORSMiddleware` to allow requests from `http://localhost:3000` (or 5173 for Vite).

#### 2\. Production / Testing (Docker Mode)

Everything runs inside the Docker network.

- **Traefik:** Acts as the entry point (ports 80/443).
- **Networking:** The frontend container does **not** talk to the backend container directly. The User's Browser talks to Traefik, which routes to either Frontend or Backend.
- **Traefik Labels (in `docker-compose.yml`):**
  - **Frontend:** Route `/` to the frontend container.
  - **Backend:** Route `/api` (or `api.yourdomain.com`) to the backend container.
- **Environment Variables:**
  - **Backend:** DB URL changes from `localhost` to `postgres` (the service name in docker-compose).
  - **Frontend:** The API URL is the _public_ URL (e.g., `https://api.yourdomain.com` or `/api` relative path), not the internal docker container name, because React runs in the _user's browser_, not inside the docker network.

### Example `docker-compose.yml` (Simplified)

```yaml
services:
  traefik:
    image: traefik:v2.10
    command: --providers.docker=true
    ports:
      - "80:80"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"

  backend:
    build: ./backend
    labels:
      - "traefik.http.routers.backend.rule=PathPrefix(`/api`) || PathPrefix(`/docs`)"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/dbname

  frontend:
    build: ./frontend
    labels:
      - "traefik.http.routers.frontend.rule=PathPrefix(`/`)"

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

This is a critical decision for data persistence and observability. In a containerized environment, the golden rule is: **Containers are ephemeral (temporary), but data must be persistent.**

Here is where to place them and how to configure them for your hybrid (Terminal vs. Docker) workflow.

### 1\. Database Files (Persistence)

You should handle this differently for Local Dev vs. Docker Production.

#### **A. In Docker (Production/Testing)**

**Do not** store database files inside your project folder. If you map a local folder (e.g., `./postgres_data`) to the container, you will run into massive file permission issues between the Linux container and your Host OS (especially on Mac/Windows).

**The Solution: Named Volumes**
Let Docker manage the storage location internally. This creates a persistent volume on your disk that survives container restarts/deletions.

In your `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data # <--- Maps internal path to a Named Volume

# Define the volume at the bottom of the file
volumes:
  postgres_data:
```

#### **B. In Local Development (Terminal)**

- **If you run Postgres via Docker for dev:** Use the same Named Volume approach as above in your `docker-compose.dev.yml`.
- **If you use SQLite (for simplicity):** Keep the `.db` file in the `backend/` root, but **strictly gitignore it**.

---

### 2\. Log Files

For a modern Python/FastAPI app running in Docker/Traefik, the philosophy changes from "writing to files" to "writing to streams."

#### **The Golden Rule: Standard Output (stdout)**

In Docker, your application should print logs to the console (`stdout` and `stderr`).

- **Why?** Docker automatically captures these streams. You can view them using `docker logs backend_container` or attach a logging driver (like AWS CloudWatch, Datadog, or ELK) later without changing your code.
- **Traefik:** Traefik also writes to stdout by default.

#### **If you MUST have physical log files (Hybrid Approach)**

Sometimes you want local files for easier debugging or auditing.

1. Create a `logs/` directory in your **Project Root**.
2. Configure Python (`backend/app/core/logging.py`) to write to **both** the console and a RotatingFileHandler inside that folder.
3. **Docker Mount:** You must map this folder in Docker to see the files on your host.

**Updated `docker-compose.yml` for Logs:**

```yaml
services:
  backend:
    volumes:
      - ./logs:/app/logs # <--- Binds host 'logs' folder to container
```

---

### Summary: Updated Project Structure

Here is where these items fit into the structure I gave you earlier:

```text
my-project-root/
├── logs/                    # <--- NEW: Create this manually
│   ├── backend.log          # Python app logs (Generated)
│   ├── traefik.log          # Access logs (Optional)
│   └── .gitkeep             # Commit the folder, but not the files
├── backend/
│   ├── app.db               # If using SQLite locally (gitignored)
│   └── ...
├── docker-compose.yml       # Defines 'postgres_data' volume
└── .gitignore               # CRITICAL: See below
```

### The `.gitignore` Setup (Crucial)

You must ensure that your production data and junk logs never accidentally get pushed to GitHub. Add this to your root `.gitignore`:

```gitignore
# Database
*.db
*.sqlite3
postgres_data/  # Just in case you accidentally created a local folder

# Logs
logs/*
!logs/.gitkeep  # Keep the folder structure, ignore the content
*.log

# Python
__pycache__/
*.pyc
.env
.venv/
```

### Next Step

To make the logging work effectively in both Docker and Terminal, you need a specific Python logging configuration.

Would you like me to provide the **`logger_config.py` code** that automatically detects the environment and switches between "Console Only" (cleaner for Dev) and "JSON/File" (better for Prod)?
