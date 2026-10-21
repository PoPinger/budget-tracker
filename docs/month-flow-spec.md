# Month flow spec

New monthly flow for the whole app. The app is used mainly on a phone in the browser, so everything is designed **mobile-first** (360–430 px first, then desktop).

Work is split into 3 stages. Each stage ends with a working app, a passing `npm run build` (plus the backend import check) and an updated `CLAUDE.md`.

| Stage | Scope | Spec points |
|---|---|---|
| 1 | Backend + migration, loading screen | 8, 1 |
| 2 | Month states, setup wizard | 2, 3 |
| 3 | Dashboard, recurring expenses, extra incomes, navigation, mobile polish, manifest | 4, 5, 6, 7 |

## Rules (all stages)

- All UI text in Polish. Amounts `1 301,00 zł` (`formatMoney`), percentages `67,5 %` (`formatPercent`), dates via `formatDate`.
- Graphite Volt colors only via CSS variables.
- Keep everything else working.
- Update `CLAUDE.md` after each stage.

---

## Stage 1: backend, migration, loading screen

> **Before pushing the migration:** create a Neon backup branch of the production DB (e.g. `backup-before-month-flow`). Production runs `alembic upgrade head` on deploy.

### 8. Backend

New data:
- Monthly salary (per user and month).
- Extra incomes table (name, amount, date; per user and month).
- Month status: `active` / `closed`.
- Recurring flag on categories.
- Link between a recurring category and its auto-created expense.

Migration:
- One safe Alembic migration. Existing months = `active`, existing categories = not recurring.
- Inspect the current schema before each step and abort with a clear message instead of deleting data (see "Database migrations" in `CLAUDE.md`).

Endpoints:
- Month setup wizard: saves salary, budget and categories (including auto-created recurring expenses) in **one transaction**.
- Copy from previous month (budget, category names, limits, recurring flags).
- Close / reopen month.
- Update salary.
- CRUD for extra incomes.

### 1. Loading screen

Branded full-screen loader, the same as in `PoPinger/gym-tracker` (`components/AppLoader.tsx`, use as reference if readable), adapted to Graphite Volt:
- Exactly centered (`100dvh`). Logo (`icons/logo-transparent.png`, ~72 px), "Budget Tracker" below (~32–34 px, same two-part styling as in the sidebar), small muted "Ładowanie aplikacji..." below that.
- No spinner. Shimmer on the "Budget Tracker" text: a light/lime highlight sweeping left to right in a loop (~1.5 s). CSS only, must work in Safari/iOS (`-webkit-background-clip: text`, `-webkit-text-fill-color`). Static with `prefers-reduced-motion`.
- Shown whenever the app waits for first data: startup, auth check, initial loads (the Render backend can take ~50 s to wake up).

---

## Stage 2: month states, setup wizard

### 2. Month states

Each month is: **not started → active → closed**. The existing month switcher (`‹ paź 2026 ›`) stays.
- **Not started:** empty screen with one primary button "Zacznij kontrolę budżetu".
- **Active:** the "Mój miesiąc" dashboard (point 4).
- **Closed:** read-only summary of that month (same dashboard, no editing) with "Otwórz ponownie".

### 3. Month setup wizard

Opened by "Zacznij kontrolę budżetu". 3-step flow with a stepper like gym-tracker's "Utwórz plan" ("Krok 1 z 3"), "Wstecz" / "Dalej", each step validated.
- **Step 1 "Wypłata":** salary for this month.
- **Step 2 "Budżet":** max spending this month. Option "Tak jak w poprzednim miesiącu". If budget > salary show the warning "Budżet przekracza wypłatę o X zł – cel oszczędnościowy będzie ujemny" (saving is still allowed).
- **Step 3 "Kategorie":** categories with limits as today. Option "Skopiuj kategorie i limity z poprzedniego miesiąca" (names, limits, recurring flags, all editable). Each category has a checkbox "Wydatek cykliczny". Live hint if limits add up to more than the budget.
- **"Zapisz"** saves everything in one transaction and opens the dashboard.

Mobile (from point 7): one step per screen, large inputs, "Dalej" fixed at the bottom, `inputmode="decimal"` for amounts with comma accepted.

---

## Stage 3: dashboard, recurring expenses, extra incomes, navigation, mobile, manifest

### 4. "Mój miesiąc" dashboard

Keep the current Graphite Volt design and tiles, plus:
- Every tile (budget, categories, expenses) has "Edytuj".
- **Salary tile:** "Edytuj" and "Dodaj przychód" (extra income: name, amount, date). Extra incomes listed under the salary, editable and deletable. Total income = salary + extra incomes.
- Add expenses from the dashboard: "+ Dodaj wydatek" on desktop, floating lime "+" on mobile.
- Budget progress bar color by usage: lime ok, amber at 80 %+, red when exceeded.
- **New tile "Cel oszczędnościowy":**
  - goal = total income − budget
  - "Cel zrealizowany w X %", X = (total income − total spent) / goal × 100; can go above 100 % ("112 % – ponad cel").
  - Green ≥ 100 %, amber 50–99 %, red < 50 %.
  - Negative goal shown in red with a short explanation.
- Existing exceeded-limits tile stays.
- **Expense list:** search (name/note) and category filter (including "Wydatki cykliczne").
- **"Zamknij miesiąc"** (confirmation dialog): closes the month and shows its summary: salary, extra incomes, total income, budget, spent, saved, goal %, exceeded limits.

### 5. Recurring expenses

- A "Wydatek cykliczny" category automatically gets an expense equal to its full limit at month setup (100 % used). If the limit changes, that expense is updated.
- In the expense list, recurring expenses are grouped into one row "Wydatki cykliczne" with the total; clicking it expands the individual items.

### 6. Navigation

- Sidebar: only "Mój miesiąc" (renamed from "Pulpit"). Remove the Wydatki, Kategorie and Budżet tabs/pages and the code that becomes unused.
- Mobile: remove the bottom tab bar, keep a floating lime "+" for adding an expense.

### 7. Mobile first

- Design and test mobile-first (360–430 px), then desktop.
- Tap targets at least 44 px, main actions at the bottom.
- `inputmode="decimal"` for amounts, comma accepted.
- Wizard: one step per screen, large inputs, "Dalej" fixed at the bottom.
- Dashboard: most important info first (remaining budget, savings goal), no horizontal scroll.
- "Edytuj" and "Dodaj przychód" open a bottom sheet on mobile.
- Floating "+" never covers content and respects `safe-area-inset`.
- Web app manifest: name "Budget Tracker", icons from the logo, Graphite Volt theme color, `display: "standalone"`.
