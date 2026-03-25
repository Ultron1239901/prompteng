# PromptLab AI

Full-stack prompt experimentation app with a React/Vite frontend and a FastAPI backend. The app generates prompt variants, scores them across multiple criteria, compares consistency, flags bias concerns, and stores results for later review.

## Stack

- Frontend: React, Vite, Tailwind, Framer Motion, Recharts
- Backend: FastAPI, SQLAlchemy, OpenRouter
- Local database: SQLite
- Production database: Postgres via `POSTGRES_URL`
- Deployment: Vercel for both frontend and backend

## Repo layout

```text
.
|- backend/
|  |- app/
|  |- api/index.py
|  |- requirements.txt
|  `- vercel.json
|- frontend/
|  |- src/
|  `- vercel.json
`- README.md
```

## Local development

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
.\run_dev.ps1
```

Backend runs on `http://127.0.0.1:8010`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs on `http://127.0.0.1:5173`.

## Environment variables

### Backend

- `OPENROUTER_API_KEY`
- `DEFAULT_MODEL`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_HTTP_REFERER`
- `OPENROUTER_APP_TITLE`
- `DATABASE_URL` for local SQLite
- `POSTGRES_URL` for deployed Postgres
- `CORS_ORIGINS`

### Frontend

- `VITE_API_URL` for the deployed backend URL
- `VITE_API_PROXY` for local proxy overrides

## Vercel deployment

Deploy this repository as two separate Vercel projects.

### 1. Backend project

- Import the repo into Vercel
- Set the root directory to `backend`
- Vercel uses `backend/api/index.py` as the Python entrypoint
- Add environment variables:
  - `OPENROUTER_API_KEY`
  - `POSTGRES_URL`
  - `CORS_ORIGINS=https://your-frontend-project.vercel.app,http://localhost:5173`
  - Optional: `DEFAULT_MODEL=openai/gpt-4o-mini`
  - Optional: `OPENROUTER_HTTP_REFERER=https://your-frontend-project.vercel.app`
  - Optional: `OPENROUTER_APP_TITLE=PromptLab AI`

### 2. Frontend project

- Import the same repo into Vercel again
- Set the root directory to `frontend`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Add environment variable:
  - `VITE_API_URL=https://your-backend-project.vercel.app`

## Production database note

Do not use SQLite for deployed history on Vercel. Vercel's filesystem is ephemeral. Use Vercel Postgres, Neon, Supabase, or another hosted Postgres instance and expose it through `POSTGRES_URL`.

## API routes

- `POST /api/experiments/run`
- `GET /api/experiments`
- `GET /api/experiments/{id}`
- `DELETE /api/experiments/{id}`
- `GET /api/health`
