# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Working rules (read first)

- **Plan first.** Before editing anything, show a plan (files + what changes) and wait for explicit approval.
- **Minimal changes.** Touch only what the task needs. No drive-by refactors, reformatting or edits to unrelated code.
- **UI text in Polish.** Every user-visible string (labels, buttons, errors, empty states) is Polish.
- **Build before commit.** Run `npm run build` in `frontend/` before every commit (and the backend import check below if backend files changed). Never commit a failing build.
- **Push only after confirmation.** Commit and push to `main` only after the user confirms. Never force push and never rewrite git history.
- **Never commit secrets.** See the Security section.

## Project overview

Budget Tracker: a Polish-language web app for controlling monthly spending. A user sets a monthly budget, creates categories with limits for a month, logs expenses and sees a month dashboard (spent, remaining, per-category usage, exceeded limits).

| Part | Stack | Deploy |
|---|---|---|
| `backend/` | FastAPI, SQLAlchemy 2, Alembic, PostgreSQL (psycopg 3), Pydantic v2 + pydantic-settings, JWT auth (python-jose, passlib pbkdf2_sha256) | Render (web service; no `render.yaml` in the repo, configured in the Render dashboard) |
| `frontend/` | React 19, Vite 8, plain JS (`App.jsx`); only the entry `main.tsx` is TypeScript | Vercel: https://budget-tracker-pi-neon.vercel.app |
| Database | PostgreSQL | Neon. Before risky migrations, create a Neon backup branch (e.g. `backup-before-migration`). |

There is no staging. Pushing to `main` may deploy to production if auto-deploy is on.

## Folder structure and key files

```
alembic.ini                    # Alembic config (repo root); DB URL comes from env, not from this file
backend/
  alembic/env.py               # uses settings.database_url
  alembic/versions/            # hand-written migrations in one linear chain
  app/main.py                  # FastAPI app, CORS, mounts /api/v1
  app/core/config.py           # Settings (env / backend/.env): DATABASE_URL, SECRET_KEY, FRONTEND_URL, APP_ENV
  app/core/security.py         # password hashing, JWT, get_current_user
  app/core/db.py               # engine, SessionLocal, get_db
  app/models/                  # User, Budget, Category, Expense
  app/schemas/                 # Pydantic schemas
  app/services/                # business logic (budget, category, expense, stats, auth)
  app/api/v1/endpoints/        # auth, budgets, categories, expenses, stats, health
frontend/
  src/main.tsx                 # entry: renders App.jsx
  src/App.jsx                  # the app: one ~1300-line component, tabs via local state
  src/Login.jsx, api.js, auth.js  # login screen, fetch client, token storage (localStorage)
  src/index.css                # all styles
  public/icons/logo.png        # original logo (white background); UI uses icons/logo-transparent.png (256x256)
  public/favicon-32.png, apple-touch-icon.png  # generated from the logo
```

API base path: `/api/v1`. Auth is a Bearer token in the `Authorization` header (no cookies).

## Running locally

Backend (run from the repo root, the imports are `backend.app...`):

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env    # then fill in DATABASE_URL
alembic upgrade head
uvicorn backend.app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
cp .env.example .env                    # VITE_API_BASE_URL=http://localhost:8000/api/v1
npm install
npm run dev                             # http://localhost:5173
npm run build                           # required before every commit
```

Backend import check (when backend files change; does not need a running DB):

```bash
DATABASE_URL=postgresql+psycopg://u:p@localhost/x python -c "import backend.app.main; print('ok')"
```

## Database migrations (Alembic)

- Run from the repo root: `alembic upgrade head`. `env.py` reads `DATABASE_URL`; `alembic.ini` has no URL.
- New migration: `alembic revision --autogenerate -m "short description"`, then **review the generated file by hand** before committing.
- `alembic check` must report no differences between models and migrations (clean since `align_schema_with_models`).
- Production runs `alembic upgrade head` on startup (configured in the Render dashboard), so a pushed migration runs on production. Test it locally on an empty DB and on a production-like DB first.
- Migrations must be safe on existing data: inspect the current schema before each step (production was partly fixed by hand) and abort with a clear message instead of deleting data.
- Never edit a migration that has already run in production; add a new one.

## Security

- **Never commit secrets.** Database URLs with passwords, `SECRET_KEY`, API keys and tokens come only from environment variables (Render / Vercel settings) or local `backend/.env` / `frontend/.env`, which are git-ignored.
- Only `*.env.example` files with placeholder values are committed.
- `SECRET_KEY` is required when `APP_ENV=production`; the app refuses to start without it. Locally a random key is generated if it is empty.
- CORS allows only `FRONTEND_URL` (comma-separated list allowed); localhost origins are added only outside production. Credentials are off because auth uses the `Authorization` header.

### Environment variables

| Where | Variable | Value |
|---|---|---|
| Render (backend) | `DATABASE_URL` | `postgresql+psycopg://USER:PASSWORD@HOST:5432/DB` (use the `postgresql+psycopg://` prefix) |
| Render (backend) | `SECRET_KEY` | long random string: `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| Render (backend) | `FRONTEND_URL` | `https://budget-tracker-pi-neon.vercel.app` (no trailing slash) |
| Render (backend) | `APP_ENV` | `production` |
| Vercel (frontend) | `VITE_API_BASE_URL` | `https://<render-service>.onrender.com/api/v1` |

## Color palette: Graphite Volt (single source of truth)

Dark premium theme: neutral graphite (not navy) with one electric-lime accent. Lime is only for actions and the active state; money states use their own semantic colors and never the accent.

**Rule:** always use these as CSS variables (`var(--color-...)`). Never hardcode hex values in components or CSS rules. Define them once in `:root` in `frontend/src/index.css`.

```css
:root {
  color-scheme: dark;

  /* Surfaces & text */
  --color-bg: #0A0A0B;              /* page background */
  --color-surface: #151517;         /* cards, panels, sidebar, tab bar */
  --color-track: #26262A;           /* progress-bar track */
  --color-text: #F2F2F3;            /* primary text */
  --color-text-secondary: #A0A0A8;  /* labels, meta, secondary text */
  --color-border: #2A2A2F;          /* dividers, card edges (decorative) */
  --color-border-strong: #6B6B75;   /* input outlines, focusable control edges (>= 3:1) */

  /* Brand */
  --color-primary: #C5F23A;         /* accent: primary buttons, active nav, normal progress bars */
  --color-on-primary: #0A0A0B;      /* text/icons on primary */
  --color-secondary: #26262A;       /* secondary buttons, chips, active tab background */
  --color-on-secondary: #ECECEE;    /* text on secondary */

  /* Money semantics */
  --color-positive: #3DDC97;        /* remaining budget, income */
  --color-negative: #FF6B6B;        /* expenses, spent amounts */
  --color-warning: #FFC14D;         /* category at >= 80 % of its limit */
  --color-warning-bg: #2A2210;      /* warning pill / banner background */
  --color-exceeded: #FF4F73;        /* category over 100 % of its limit */
  --color-exceeded-bg: #2C1219;     /* exceeded pill / banner background */
}
```

Contrast (WCAG): every text pair above passes AA (most AAA). Examples: text on bg 17.7:1, secondary text on surface 7.0:1, on-primary on primary 15.2:1, negative on surface 6.6:1, exceeded on its tint 5.5:1, input border on surface 3.5:1. Plain `--color-border` is about 1.3:1 and must only be used for decorative separation, never as the only edge of a control.

Warning and exceeded states are never shown by color alone: also use a pill with an icon or text (e.g. "▲ Przekroczono o 20,00 zł").

## Known issues (TODO)

Backend / database:
- [x] ~~Adding an expense returns 500 on a fresh DB (leftover `expenses.title NOT NULL`)~~: column dropped in `align_schema_with_models` (on production it had already been dropped by hand).
- [x] ~~Category names unique across all users~~: now `uq_categories_user_id_month_name` on `(user_id, month, name)`.
- [x] ~~`alembic check` reported 13 diffs~~: fixed by `align_schema_with_models`; now clean.
- [ ] Legacy migration inserts a placeholder user `legacy-user@example.com` (id 1) with an invalid password hash.
- [x] ~~Duplicate category / budget returned 500~~: create and update now return 409 (pre-check plus the DB constraint for concurrent requests).
- [x] ~~Public `/api/v1/db-test/db-test` endpoint~~: removed.
- [x] ~~Production DB status unknown~~: Neon PostgreSQL (backup branch `backup-before-migration`).

Frontend:
- [x] ~~Unused TS router pages, `api/*.ts`, layout, `App.css`, template assets~~: removed, along with `react-router-dom`.
- [ ] Selected month is hardcoded to `2026-04-01`; the dashboard is empty after login.
- [ ] Month picker is a full date input; any day other than the 1st shows no data (backend matches `month` exactly).
- [ ] The expense category dropdown lists categories from all months.
- [ ] The UI blocks any expense that would exceed a category limit, so "exceeded" is practically unreachable; there is no "near the limit" warning.
- [ ] Amounts in tables are unformatted (`38.2`); dates are raw ISO strings.
- [ ] Tables are cut off on mobile.
- [ ] Success/error notices are detected by substring matching on Polish messages ("dodany", "zosta").
- [x] ~~`index.html` title is "frontend" and `lang="en"`~~: now "Budget Tracker", `lang="pl"`, PNG favicons.
- [ ] The whole UI uses the old navy/blue theme; replace it with Graphite Volt.

Product / tooling:
- [ ] No income concept (only budget and expenses).
- [ ] No tests, no CI, no lint step.
- [x] ~~README local-setup section truncated and Windows-only~~: rewritten for Windows and macOS/Linux.
