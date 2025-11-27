# Authentication & Database Architecture

This document describes the authentication and database architecture implemented in the skola-alpha application.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture Diagram](#architecture-diagram)
- [Database Schema](#database-schema)
- [Authentication Flow](#authentication-flow)
- [Backend Components](#backend-components)
- [Frontend Components](#frontend-components)
- [Security Considerations](#security-considerations)
- [API Endpoints](#api-endpoints)

## Overview

The skola-alpha application implements a modern authentication system using:
- **Google OAuth2** for user authentication
- **JWT tokens** for session management
- **SQLAlchemy** ORM with **Alembic** migrations for database management
- **React** with context-based state management on the frontend

### Key Features

✅ Google OAuth2 authentication
✅ User profile storage in database
✅ JWT-based session management
✅ Light/Dark theme toggle with persistence
✅ User avatar and profile display
✅ Secure logout functionality
✅ Backend health monitoring

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: SQLAlchemy 2.0+
- **Migrations**: Alembic 1.13+
- **Authentication**:
  - `authlib` - OAuth2 client
  - `python-jose` - JWT token handling
  - `passlib` - Password hashing (for future use)
- **HTTP Client**: `httpx` - For Google API calls

### Frontend
- **Framework**: React 18.3+ with TypeScript
- **Build Tool**: Vite 5.0+
- **OAuth Library**: `@react-oauth/google`
- **State Management**: React Context API

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           Frontend                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  GoogleOAuthProvider                                     │   │
│  │    └── AuthProvider (Context)                            │   │
│  │          ├── App                                          │   │
│  │          │   ├── Login (if not authenticated)            │   │
│  │          │   └── Dashboard (if authenticated)            │   │
│  │          │         ├── UserProfile (header)              │   │
│  │          │         └── HealthCheck (main content)        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           │ HTTP/JSON                           │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Backend API                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  FastAPI Application                                     │   │
│  │    ├── /auth/google (POST)   ─────┐                      │   │
│  │    ├── /auth/me (GET)             │                      │   │
│  │    ├── /auth/logout (POST)        │                      │   │
│  │    └── /health (GET)               │                      │   │
│  └────────────────────────────────────┼───────────────────────   │
│                                       │                         │
│  ┌────────────────────────────────────┼───────────────────────   │
│  │  Authentication Layer              │                      │   │
│  │    ├── JWT Token Generation        │                      │   │
│  │    ├── Token Verification          │                      │   │
│  │    └── User Extraction             │                      │   │
│  └────────────────────────────────────┼───────────────────────   │
│                                       │                         │
│                                       ▼                         │
│                          Google OAuth2 API                      │
│                          (User Info Fetch)                      │
│                                       │                         │
│  ┌────────────────────────────────────┼───────────────────────   │
│  │  Database Layer                    │                      │   │
│  │    ├── SQLAlchemy ORM              │                      │   │
│  │    ├── User Model                  │                      │   │
│  │    └── Session Management          │                      │   │
│  └────────────────────────────────────┼───────────────────────   │
└───────────────────────────────────────┼─────────────────────────┘
                                        │
                                        ▼
                            ┌────────────────────┐
                            │   Database         │
                            │  (SQLite/Postgres) │
                            │                    │
                            │  ┌──────────────┐  │
                            │  │ users table  │  │
                            │  └──────────────┘  │
                            └────────────────────┘
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id VARCHAR NOT NULL UNIQUE,
    email VARCHAR NOT NULL UNIQUE,
    name VARCHAR,
    picture VARCHAR,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX ix_users_id (id),
    INDEX ix_users_google_id (google_id),
    INDEX ix_users_email (email)
);
```

### User Model (SQLAlchemy)

**File**: `backend/app/models.py`

```python
class User(Base):
    __tablename__ = "users"

    id: Integer (Primary Key)
    google_id: String (Unique, Indexed)
    email: String (Unique, Indexed)
    name: String (Nullable)
    picture: String (Nullable, URL to avatar)
    created_at: DateTime
    updated_at: DateTime
```

### Database Migration

The database is managed using Alembic migrations:

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

**Migration File**: `backend/alembic/versions/8cf3ee8e6f33_create_users_table.py`

## Authentication Flow

### 1. Initial Login Flow

```
┌──────────┐                                     ┌──────────┐
│          │  1. Click "Sign in with Google"     │          │
│  User    ├────────────────────────────────────▶│ Frontend │
│          │                                     │          │
└──────────┘                                     └─────┬────┘
                                                       │
                                                       │ 2. Redirect to Google
                                                       ▼
                                               ┌────────────────┐
                                               │                │
                                               │  Google OAuth  │
                                               │                │
                                               └───────┬────────┘
                                                       │
                                                       │ 3. User authenticates
                                                       │    & grants permission
                                                       │
┌──────────┐                                     ┌─────▼────┐
│          │  4. Redirect with auth code         │          │
│  User    │◀────────────────────────────────────┤ Frontend │
│          │                                     │          │
└──────────┘                                     └─────┬────┘
                                                       │
                                                       │ 5. POST /auth/google
                                                       │    { code, redirect_uri }
                                                       ▼
                                               ┌────────────────┐
                                               │                │
                                               │    Backend     │
                                               │                │
                                               └───────┬────────┘
                                                       │
                                                       │ 6. Exchange code for
                                                       │    Google access token
                                                       ▼
                                               ┌────────────────┐
                                               │  Google OAuth  │
                                               │  Token API     │
                                               └───────┬────────┘
                                                       │
                                                       │ 7. Get user info
                                                       ▼
                                               ┌────────────────┐
                                               │  Google User   │
                                               │  Info API      │
                                               └───────┬────────┘
                                                       │
                                                       │ 8. User data
                                                       ▼
                                               ┌────────────────┐
                                               │                │
                                               │    Backend     │
                                               │                │
                                               └───────┬────────┘
                                                       │
                                                       │ 9. Create/Update user
                                                       │    in database
                                                       ▼
                                               ┌────────────────┐
                                               │                │
                                               │   Database     │
                                               │                │
                                               └───────┬────────┘
                                                       │
                                                       │ 10. Generate JWT token
                                                       │
┌──────────┐                                     ┌─────▼────┐
│          │  11. Return { access_token }        │          │
│ Frontend │◀────────────────────────────────────┤ Backend  │
│          │                                     │          │
└─────┬────┘                                     └──────────┘
      │
      │ 12. Store token in localStorage
      │     Fetch user data with token
      │
      ▼
┌──────────┐
│          │
│  User    │  13. Show Dashboard with
│          │      user profile
└──────────┘
```

### 2. Subsequent Page Loads

```
┌──────────┐                                     ┌──────────┐
│          │  1. Load page                       │          │
│  User    ├────────────────────────────────────▶│ Frontend │
│          │                                     │          │
└──────────┘                                     └─────┬────┘
                                                       │
                                                       │ 2. Check localStorage
                                                       │    for auth_token
                                                       │
                                                       │ 3. If token exists:
                                                       │    GET /auth/me
                                                       │    Authorization: Bearer <token>
                                                       ▼
                                               ┌────────────────┐
                                               │                │
                                               │    Backend     │
                                               │                │
                                               └───────┬────────┘
                                                       │
                                                       │ 4. Verify JWT token
                                                       │    Extract user_id
                                                       │
                                                       │ 5. Query user from DB
                                                       ▼
                                               ┌────────────────┐
                                               │                │
                                               │   Database     │
                                               │                │
                                               └───────┬────────┘
                                                       │
                                                       │ 6. Return user data
┌──────────┐                                     ┌─────▼────┐
│          │  7. Show Dashboard                  │          │
│  User    │◀────────────────────────────────────┤ Frontend │
│          │                                     │          │
└──────────┘                                     └──────────┘
```

### 3. Logout Flow

```
┌──────────┐                                     ┌──────────┐
│          │  1. Click "Logout"                  │          │
│  User    ├────────────────────────────────────▶│ Frontend │
│          │                                     │          │
└──────────┘                                     └─────┬────┘
                                                       │
                                                       │ 2. POST /auth/logout
                                                       │    Authorization: Bearer <token>
                                                       ▼
                                               ┌────────────────┐
                                               │                │
                                               │    Backend     │
                                               │                │
                                               └───────┬────────┘
                                                       │
                                                       │ 3. Log logout (optional)
                                                       │    Future: Add to blacklist
                                                       │
┌──────────┐                                     ┌─────▼────┐
│          │  4. Clear localStorage              │          │
│  User    │◀────────────────────────────────────┤ Frontend │
│          │     Show Login screen               │          │
└──────────┘                                     └──────────┘
```

## Backend Components

### File Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app & middleware
│   ├── database.py          # DB engine & session
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # JWT & OAuth utilities
│   └── routers.py           # API endpoints
├── alembic/
│   ├── versions/            # Migration files
│   ├── env.py               # Alembic config
│   └── script.py.mako       # Migration template
├── alembic.ini              # Alembic settings
├── pyproject.toml           # Dependencies
└── .env                     # Environment variables
```

### Key Backend Files

#### `app/database.py`
- Creates SQLAlchemy engine
- Defines `SessionLocal` for DB sessions
- Provides `get_db()` dependency for FastAPI
- Supports both SQLite and PostgreSQL

#### `app/models.py`
- Defines `User` model
- Maps to `users` table in database
- Includes timestamps (created_at, updated_at)

#### `app/schemas.py`
- Pydantic models for request/response validation
- `UserResponse` - API response format
- `GoogleAuthRequest` - OAuth code exchange request
- `Token` - JWT token response
- `TokenData` - JWT payload structure

#### `app/auth.py`
- `create_access_token()` - Generates JWT tokens
- `verify_token()` - Validates JWT tokens
- `get_current_user()` - FastAPI dependency for protected routes
- Loads Google OAuth credentials from environment

#### `app/routers.py`
- `POST /auth/google` - Exchange OAuth code for JWT
  1. Exchanges authorization code with Google
  2. Fetches user info from Google
  3. Creates/updates user in database
  4. Returns JWT token
- `GET /auth/me` - Get current user (requires auth)
- `POST /auth/logout` - Logout endpoint

#### `app/main.py`
- Initializes FastAPI application
- Configures CORS middleware (with credentials enabled)
- Creates database tables on startup
- Includes authentication router
- Exposes `/health` and `/metrics` endpoints

## Frontend Components

### File Structure

```
frontend/src/
├── components/
│   ├── Login.tsx           # Google OAuth login screen
│   ├── UserProfile.tsx     # Header with user info
│   └── Dashboard.tsx       # Main content area
├── AuthContext.tsx         # Authentication state management
├── authService.ts          # API calls for auth
├── types.ts                # TypeScript interfaces
├── App.tsx                 # Main app component
└── main.tsx                # Entry point with providers
```

### Key Frontend Files

#### `AuthContext.tsx`
React Context providing:
- `user` - Current user object or null
- `token` - JWT token or null
- `theme` - Current theme (light/dark)
- `isLoading` - Initial auth check state
- `login(code, redirectUri)` - Exchange OAuth code
- `logout()` - Clear session
- `toggleTheme()` - Switch theme

Persists to localStorage:
- `auth_token` - JWT token
- `theme` - User's theme preference

#### `authService.ts`
API client methods:
- `exchangeCodeForToken()` - POST /auth/google
- `getCurrentUser()` - GET /auth/me
- `logout()` - POST /auth/logout

#### `components/Login.tsx`
- Displays Google OAuth button
- Uses `@react-oauth/google` library
- Configured for authorization code flow
- Handles OAuth redirect callback
- Extracts code from URL and exchanges for token

#### `components/UserProfile.tsx`
- Fixed header bar
- Shows user avatar and name
- Theme toggle button (🌞/🌙)
- Logout button
- Adapts to light/dark theme

#### `components/Dashboard.tsx`
- Main content area
- Displays backend health status
- Adapts to light/dark theme
- Shows /health endpoint result

#### `App.tsx`
- Root component
- Shows loading state during initial auth check
- Renders `<Login>` if not authenticated
- Renders `<UserProfile>` + `<Dashboard>` if authenticated

#### `main.tsx`
- Entry point
- Wraps app with `GoogleOAuthProvider`
- Wraps app with `AuthProvider`
- Loads `VITE_GOOGLE_CLIENT_ID` from env

## Security Considerations

### ✅ Implemented Security Features

1. **JWT Token Expiration**
   - Tokens expire after 30 minutes (configurable)
   - Prevents long-term token abuse

2. **HTTPS in Production**
   - OAuth requires HTTPS for production
   - Protects tokens in transit

3. **CORS Configuration**
   - Restricts API access to specific origins
   - Credentials enabled for authenticated requests

4. **Token Storage**
   - Stored in localStorage (client-side)
   - Cleared on logout

5. **Database Indexing**
   - Indexed columns for performance
   - Unique constraints on email and google_id

6. **Input Validation**
   - Pydantic schemas validate all inputs
   - Prevents injection attacks

### 🔒 Future Security Enhancements

1. **Token Blacklisting**
   - Maintain list of invalidated tokens
   - Use Redis for fast lookups

2. **Refresh Tokens**
   - Implement refresh token rotation
   - Shorter access token expiration

3. **Rate Limiting**
   - Prevent brute force attacks
   - Limit authentication attempts

4. **CSRF Protection**
   - Add CSRF tokens for state-changing operations

5. **Session Monitoring**
   - Track active sessions
   - Detect suspicious activity

6. **Secure Cookies**
   - Move tokens from localStorage to httpOnly cookies
   - Prevents XSS token theft

7. **User Roles & Permissions**
   - Add role-based access control
   - Admin vs regular user privileges

## API Endpoints

### Authentication Endpoints

#### `POST /auth/google`
Exchange Google OAuth authorization code for JWT token.

**Request**:
```json
{
  "code": "4/0AfJohXk...",
  "redirect_uri": "http://localhost:5173"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors**:
- 401 Unauthorized - Invalid or expired code
- 500 Internal Server Error - OAuth not configured

---

#### `GET /auth/me`
Get current authenticated user information.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "google_id": "1234567890",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/a/...",
  "created_at": "2025-01-01T12:00:00",
  "updated_at": "2025-01-01T12:00:00"
}
```

**Errors**:
- 401 Unauthorized - Invalid or missing token
- 404 Not Found - User not found in database

---

#### `POST /auth/logout`
Logout current user (clears session on client side).

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "message": "Successfully logged out"
}
```

---

### Operational Endpoints

#### `GET /health`
Health check endpoint.

**Response** (200 OK):
```json
{
  "status": "ok"
}
```

---

#### `GET /metrics`
Prometheus metrics endpoint.

**Response** (200 OK):
```
# HELP app_uptime_seconds Application uptime in seconds
# TYPE app_uptime_seconds gauge
app_uptime_seconds 123.45
```

---

## Environment Variables

### Backend (.env)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Database connection string | No | `sqlite:///./skola_alpha.db` |
| `SECRET_KEY` | JWT signing key | Yes | - |
| `ALGORITHM` | JWT algorithm | No | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | No | `30` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Yes | - |
| `HOST` | Server host | No | `0.0.0.0` |
| `PORT` | Server port | No | `8000` |
| `CORS_ORIGINS` | Allowed CORS origins | No | `http://localhost:5173` |

### Frontend (.env)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_BASE_URL` | Backend API URL | No | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes | - |
| `VITE_APP_NAME` | Application name | No | `Skola Alpha` |
| `VITE_APP_VERSION` | Application version | No | `0.0.1` |

---

## Development Workflow

### Running Locally

1. **Backend**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your credentials
   uv sync
   .venv/bin/alembic upgrade head
   .venv/bin/uvicorn app.main:app --reload
   ```

2. **Frontend**:
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your credentials
   npm install
   npm run dev
   ```

### Making Database Changes

1. Modify models in `backend/app/models.py`
2. Generate migration:
   ```bash
   cd backend
   .venv/bin/alembic revision --autogenerate -m "Description of change"
   ```
3. Review generated migration in `alembic/versions/`
4. Apply migration:
   ```bash
   .venv/bin/alembic upgrade head
   ```

### Testing Authentication

1. Ensure Google OAuth is configured (see [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md))
2. Start both backend and frontend
3. Navigate to `http://localhost:5173`
4. Click "Sign in with Google"
5. Authenticate with test user
6. Verify user appears in database:
   ```bash
   cd backend
   sqlite3 skola_alpha.db "SELECT * FROM users;"
   ```

---

## Monitoring & Debugging

### Backend Logs

Enable debug logging:
```bash
.venv/bin/uvicorn app.main:app --reload --log-level debug
```

### Database Inspection

SQLite:
```bash
cd backend
sqlite3 skola_alpha.db
.tables
SELECT * FROM users;
.quit
```

### Check Current Migration

```bash
cd backend
.venv/bin/alembic current
```

### View Migration History

```bash
cd backend
.venv/bin/alembic history
```

---

## Deployment Considerations

### Database Migration

For PostgreSQL in production:
```bash
# Update DATABASE_URL in .env
DATABASE_URL=postgresql://user:password@host:5432/skola_alpha

# Run migrations
alembic upgrade head
```

### Reverse Proxy Configuration

Example Nginx config for HTTPS:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Future Enhancements

### Planned Features

- [ ] Admin dashboard for user management
- [ ] User profile editing
- [ ] Email verification
- [ ] Password reset (for future password auth)
- [ ] OAuth provider expansion (GitHub, Microsoft, etc.)
- [ ] Two-factor authentication (2FA)
- [ ] User activity logging
- [ ] Session management (multiple devices)

### Database Enhancements

- [ ] Add user roles and permissions
- [ ] User preferences table
- [ ] Audit log table
- [ ] OAuth token storage (for API access)

---

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [JWT.io](https://jwt.io/)
- [React Context API](https://react.dev/reference/react/useContext)
