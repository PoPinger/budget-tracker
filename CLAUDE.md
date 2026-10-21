# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Working rules (read first)

- **Plan first.** Before editing anything, show a plan (files + what changes) and wait for explicit approval.
- **Minimal changes.** Touch only what the task needs. No drive-by refactors, reformatting or edits to unrelated code.
- **UI text in Polish.** Every user-visible string (labels, buttons, errors, empty states) is Polish. Money via `formatMoney` (`1 301,00 zł`), percentages via `formatPercent`, dates via `formatDate`.
- **Build before commit.** Run `npm run build` in `frontend/` before every commit (and the backend import check below if backend files changed). Never commit a failing build.
- **Push only after confirmation.** Commit and push to `main` only after the user confirms. Never force push and never rewrite git history.
- **Never commit secrets.** See the Security section.

## Project overview

Budget Tracker: a Polish-language web app for controlling monthly spending. A user starts a month (salary, budget, categories with limits), logs expenses and extra incomes and sees one "Mój miesiąc" dashboard (remaining budget, savings goal, per-category usage, exceeded limits), then closes the month to get a read-only summary.

| Part | Stack | Deploy |
|---|---|---|
| `backend/` | FastAPI, SQLAlchemy 2, Alembic, PostgreSQL (psycopg 3), Pydantic v2 + pydantic-settings, JWT auth (python-jose, passlib pbkdf2_sha256) | Render (web service; no `render.yaml` in the repo, configured in the Render dashboard) |
| `frontend/` | React 19, Vite 8, plain JS (`.jsx`); only the entry `main.tsx` is TypeScript | Vercel: https://budget-tracker-pi-neon.vercel.app |
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
  app/models/                  # User, Budget, Category, Expense, Month (salary + status), Income (extra incomes)
  app/schemas/                 # Pydantic schemas
  app/services/                # business logic (budget, category, expense, stats, auth, month, month_setup,
                               # income, recurring)
  app/api/v1/endpoints/        # auth, budgets, categories, expenses, stats, months, incomes, health
frontend/
  src/main.tsx                 # entry: renders App.jsx
  src/App.jsx                  # auth gate + layout (sidebar, floating "+"); month state -> setup / empty / dashboard;
                               # calls all state hooks
  src/api.js, auth.js          # fetch client, token storage (localStorage)
  src/hooks/                   # useBudgetData (server data + loaders), useMessages (page banner), useSheets (open sheet),
                               # useMonthSetup (wizard), useIncomeForms / useBudgetForms / useCategoryForms /
                               # useExpenseForms (sheet forms), useMonthActions (close / reopen), useExpenseFilters,
                               # useSwipe (month change by swiping the mobile header)
  src/pages/                   # LoginPage, DashboardPage ("Mój miesiąc"), MonthSetupPage, MonthSheets (all sheets) (render only)
  src/components/              # Tile, BottomSheet, AddExpenseFab, AmountInput, CategoryRowsEditor (wizard + sheet),
                               # MonthEmptyState, MonthClosedNotice, Stepper (month flow),
                               # AppLoader (full-screen loader), BrandName (two-tone "Budget Tracker"),
                               # Sidebar (desktop), PageHeader, MonthSwitcher, AccountMenu,
                               # Panel (card), ProgressBar, LimitPill, ExpenseRow, Notice, Banner
  src/utils/                   # format.js (money/percent/date/month names, Polish plurals, toAmountInput), month.js,
                               # budget.js (spent per category, limit/budget state, savingsGoal),
                               # validation.js (parseAmount, form validators, over-limit warning)
  src/index.css                # all styles; Graphite Volt variables in :root; mobile layout below 900 px
  public/icons/logo.png        # original logo (white background); UI uses icons/logo-transparent.png (256x256)
  public/favicon-32.png, apple-touch-icon.png  # generated from the logo
  public/manifest.webmanifest  # PWA manifest (standalone, Graphite Volt colors); icons/icon-192, icon-512, icon-maskable-512
```

State rule: all app state lives in hooks called by `App.jsx`, not inside pages or sheets. Pages and sheets only render.

API base path: `/api/v1`. Auth is a Bearer token in the `Authorization` header (no cookies).

Month flow data (stage 1):
- `months`: one row per started month (`user_id`, `month`, `salary` nullable, `status` `active`/`closed`, `closed_at`). No row = not started. Creating a budget, category or expense through the old endpoints also starts the month (`ensure_month_started`).
- `incomes`: extra incomes; `month` is derived from `income_date`.
- `categories.is_recurring`: a recurring category has exactly one auto-created expense with `expenses.is_recurring = true` (partial unique index `uq_expenses_recurring_category_id`). `sync_recurring_expense` keeps its amount equal to the limit and removes it when the flag is turned off.
- Endpoints: `GET /months/{month}`, `POST /months/setup` (salary + budget + categories + recurring expenses in one transaction, 409 if the month is already started), `GET /months/{month}/previous` (data to copy), `POST /months/{month}/close`, `POST /months/{month}/reopen`, `PUT /months/{month}/salary`, CRUD `/incomes` (`?month=`).
- Closed months are read-only: every create/update/delete of a budget, category, expense, income or salary in a closed month (including moving data into or out of one) returns 409 "Miesiąc jest zamknięty. Otwórz go ponownie, aby wprowadzić zmiany." (`ensure_month_open` in `month_service`).
- Frontend: `AppLoader` is shown until the first `loadAllData` finishes (`useBudgetData().initialLoading`).

Month flow frontend (stage 2):
- `useBudgetData().month` holds the selected month's state; `loadOverview` always reloads it too (old forms can start a month).
- Page by status: `not_started` -> `MonthEmptyState` ("Zacznij kontrolę budżetu"); `active` -> dashboard; `closed` -> `MonthClosedNotice` ("Otwórz ponownie") + read-only summary. "Zamknij miesiąc / Dodaj wydatek" and the mobile "+" are shown only in an active month.
- Setup wizard: `useMonthSetup` (state, per-step validation, copy from previous month, save) + `pages/MonthSetupPage.jsx` + `components/Stepper.jsx`. Amounts are text inputs with `inputmode="decimal"`, parsed by `parseAmount` (comma accepted). On mobile "Wstecz / Dalej" is fixed at the bottom.
- `api.js` turns FastAPI 422 lists into Polish text: custom messages (e.g. "Kwota jest za duża.") as they are, `value_error` without the "Value error, " prefix, built-in pydantic errors mapped to Polish (`VALIDATION_MESSAGES`). Add new `PydanticCustomError` types to `CUSTOM_ERROR_TYPES`.

Month flow frontend (stage 3, design: "Stage 3 design" in the spec):
- One page, "Mój miesiąc" (`DashboardPage`): 6 tiles (Pozostało, Cel oszczędnościowy, Przychody, Budżet, Wydano, Limity), "Kategorie" card, "Wydatki" card (search by name/note, filter chips incl. "Wydatki cykliczne", recurring expenses grouped in one expandable row), mobile "Zamknij miesiąc" at the end. The Wydatki / Kategorie / Budżet pages and the bottom tab bar are gone.
- Editing happens in sheets (`BottomSheet`: bottom sheet below 900 px, centered dialog above; one open at a time via `useSheets`): Przychody (salary + extra incomes list) -> Dodaj/Edytuj przychód, Edytuj budżet, Kategorie (all rows at once, saved as delete/update/create calls), Dodaj/Edytuj wydatek (tap an expense row; recurring expenses are not edited, they follow the category limit), "Zamknąć miesiąc?" dialog. Sheet errors stay in the sheet; success goes to the page banner.
- Totals: total income = `month.salary + month.extra_income_total`. Savings goal = income − budget; % realized (`savingsGoal` in `utils/budget.js`): active month `(income − max(spent, budget)) / goal`, closed month `(income − spent) / goal`.
- Closed month: summary tiles (Przychody razem, Wydano, Zaoszczędzono, Cel, Budżet, Limity), "Przekroczone limity" card, read-only Kategorie / Wydatki (search and filters still work).
- Month switcher (`MonthSwitcher`): no month list and no range limit; ‹ › move one month, tapping the month label jumps back to the current month (a lime dot marks "not the current month"). Desktop: compact "‹ paź 2026 ›" in the header; mobile: "‹ Październik 2026 ›" is the page title, and swiping the mobile header left / right goes to the next / previous month. Months without data show "Zacznij kontrolę budżetu".
- Amount inputs everywhere: `AmountInput` (`inputmode="decimal"`, comma accepted via `parseAmount`). Expense and income dates must be inside the selected month.

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
  --color-surface: #151517;         /* cards, panels, sidebar, sheets */
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

## Planned work: month flow

Spec: [`docs/month-flow-spec.md`](docs/month-flow-spec.md) (month states, setup wizard, "Mój miesiąc" dashboard, salary/extra incomes, savings goal, recurring expenses, loading screen, mobile-first). Done in 3 stages; update this file after each one. Stage 3 UI must follow "Stage 3 design" in the spec (tile grid, mockup: [`docs/stage3-mockup.html`](docs/stage3-mockup.html)).

- [x] Stage 1: backend + migration (`month_flow`), loading screen
- [x] Stage 2: month states + setup wizard (+ closed months read-only on the backend)
- [x] Stage 3: dashboard, recurring expenses, extra incomes, navigation, mobile polish, manifest (frontend only)

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
- [x] ~~Selected month hardcoded to April 2026~~: starts on the current month.
- [x] ~~Month picker was a date input~~: month switcher, always the 1st of the month.
- [x] ~~Expense category dropdown listed all months~~: only the selected month's categories.
- [x] ~~Over-limit expenses were blocked~~: allowed, with an inline amber warning before saving; warning (>= 80 %) and exceeded pills everywhere.
- [x] ~~Unformatted amounts and ISO dates~~: `1 301,00 zł`, `67,5 %`, `17 paź 2026`.
- [x] ~~Tables cut off on mobile~~: no tables; rows become cards on mobile.
- [x] ~~Success/error notices are detected by substring matching on Polish messages~~: `useMessages().showMessage(text, tone)` carries the tone.
- [x] ~~`index.html` title is "frontend" and `lang="en"`~~: now "Budget Tracker", `lang="pl"`, PNG favicons.
- [x] ~~Old navy/blue theme~~: Graphite Volt redesign (sidebar, cards, pills; tile dashboard since stage 3).

Product / tooling:
- [x] ~~No income concept~~: monthly salary (`months.salary`) and extra incomes (`incomes`) on the backend; UI in stages 2–3.
- [ ] No tests, no CI, no lint step.
- [ ] `npx eslint src` crashes (`eslint.config.js` reads `.recommended` from a plugin that no longer exposes it); fix the config before adding a lint step.
- [x] ~~README local-setup section truncated and Windows-only~~: rewritten for Windows and macOS/Linux.
