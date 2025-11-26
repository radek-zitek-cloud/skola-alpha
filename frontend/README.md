# Frontend (React/Vite) v0.0.1

## Quick start

```bash
cd frontend
npm install
npm run dev
```

- API origin defaults to `http://localhost:8000`; override with `VITE_API_BASE_URL`.
- The app renders a status card and checks `GET /health` on load.

## Scripts

- `npm run dev` — start Vite dev server (http://localhost:5173).
- `npm run build` — type-check and build production assets.
- `npm test` — run unit tests with Vitest/JSDOM.

## Notes

- Keep `package-lock.json` committed after installs.
- When calling a different backend host/port, set `VITE_API_BASE_URL` accordingly.
