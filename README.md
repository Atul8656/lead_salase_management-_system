# SALENLO — Sales & lead management

Full-stack CRM:

- **Frontend:** Next.js (React) — dev server default `http://localhost:3000`
- **Backend:** FastAPI + uvicorn — default `http://127.0.0.1:8000`
- **Database:** Supabase (PostgreSQL)

> This repo uses **Next.js**, not Create React App. Environment variables use `NEXT_PUBLIC_API_URL` (recommended) or `REACT_APP_API_URL` (supported for parity with CRA-style docs). Both are read in `frontend/lib/api.ts`.

## Quick start (local)

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL`, `SECRET_KEY`, etc.

Run API on all interfaces so Cloudflare Tunnel can reach it:

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- Health: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- Swagger: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # optional; see Cloudflare section below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The browser logs which API URL is used, for example:

`[SALENLO] API base URL: http://127.0.0.1:8000 (from default (...))`

## CORS

The API allows:

- `http://localhost:3000`, `http://127.0.0.1:3000` (and `:3001` variants)
- Any origin matching `https://*.trycloudflare.com` (Cloudflare quick tunnels)
- Extra origins from `CORS_ORIGINS` in `backend/.env` (comma-separated)

Methods and headers: `*`. Credentials are allowed (for future cookie-based auth; the app uses `Authorization: Bearer` today).

## Cloudflare Tunnel (public API URL)

Use this when you want phones or teammates to hit **your laptop’s** FastAPI without deploying.

### Install `cloudflared`

- **Windows (winget):** `winget install --id Cloudflare.cloudflared`
- **macOS (Homebrew):** `brew install cloudflared`
- **Docs:** [https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)

### Run tunnel (separate terminal)

With the backend already running on port **8000**:

```bash
cloudflared tunnel --url http://localhost:8000
```

Or from repo root / `frontend`:

```bash
npm run tunnel
```

`cloudflared` prints a URL like `https://random-words.trycloudflare.com`. **Copy it** (no trailing slash).

### Point the frontend at the tunnel

1. In `frontend/.env.local` set **one** of:

 ```env
   NEXT_PUBLIC_API_URL=https://random-words.trycloudflare.com
   ```

   or

   ```env
   REACT_APP_API_URL=https://random-words.trycloudflare.com
   ```

2. Restart the Next dev server (`npm run dev`).

3. Open the app at `http://localhost:3000` and confirm the console line shows your tunnel URL.

4. Sanity-check the API in the browser:  
   `https://random-words.trycloudflare.com/docs`

> **Note:** Quick-tunnel hostnames change each time you restart `cloudflared` (unless you use a named tunnel). After each new URL, update `frontend/.env.local` and restart `npm run dev`.

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| CORS errors | Frontend origin must be localhost:3000 or a `*.trycloudflare.com` page, or listed in `CORS_ORIGINS`. |
| `Cannot reach the server` | Backend running? Tunnel URL correct in `.env.local`? Try `/docs` on that URL. |
| Old API URL after tunnel restart | Update `.env.local` and restart Next. |

## Features

- Lead management, pipeline board, follow-ups, team
