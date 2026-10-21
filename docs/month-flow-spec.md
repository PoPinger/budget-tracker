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
  - "Cel zrealizowany w X %":
    - **Active month:** X = (total income − max(total spent, budget)) / goal × 100. Unspent budget is not counted as saved yet, so X stays at 100 % while spending is within the budget and drops only when the budget is overspent.
    - **Closed month:** X = (total income − total spent) / goal × 100. Can go above 100 % ("112 % – ponad cel").
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

---

## Stage 3 design (required): "Kafelki" tile grid

Chosen from three proposals. Reference mockup: [`docs/stage3-mockup.html`](stage3-mockup.html). It is static with sample data; open it in a browser and use the "Makieta" bar at the top to switch states. Where this section and the mockup differ, this section wins. Everything uses the existing Graphite Volt components (`Panel`, `ProgressBar`, `LimitPill`, `ExpenseRow`, pills, buttons) and CSS variables only.

### Page structure (active month)

From top to bottom:
1. Header: unchanged from today (mobile: greeting, month name, month pill, account menu; desktop: overline "Mój miesiąc", month title, month switcher, "Zamknij miesiąc" (secondary) and "+ Dodaj wydatek" (primary)).
2. Tile grid (6 tiles).
3. "Kategorie" card and "Wydatki" card (side by side on desktop, stacked on mobile).
4. Mobile only: full-width secondary button "Zamknij miesiąc" at the very end of the page.
5. Mobile only: floating lime "+" (add expense).

### Tile grid

Equal tiles: 2 columns on mobile, 3 columns on desktop (≥ 900 px). Fixed order (left to right, top to bottom):

| # | Tile | Value | Content below the value | Edit |
|---|---|---|---|---|
| 1 | **Pozostało do wydania** | budget − spent; `--color-positive`, `--color-exceeded` when negative | budget progress bar (lime < 80 %, amber 80–100 %, red > 100 %) + "Wydano X % budżetu" | – |
| 2 | **Cel oszczędnościowy** (target icon) | goal amount; red when negative | goal pill with icon + percentage (`✓ 100 %` green / `● 72 %` amber / `▲ 31 %` red) + "Cel zrealizowany · na dziś" or "Ponad cel"; negative goal: short explanation "Budżet przekracza przychody o X" | – |
| 3 | **Przychody** | total income (salary + extra incomes), positive color | "Wypłata X" + "+ N dodatkowe" | pencil → "Przychody" sheet |
| 4 | **Budżet** | budget | "X % przychodów" | pencil → "Edytuj budżet" sheet |
| 5 | **Wydano** | total spent, negative color | "N wydatków" | – |
| 6 | **Limity** | "exceeded / all categories" | pill "▲ N przekroczony/e" or "✓ Wszystkie w normie" | – (tap scrolls to "Kategorie") |

- Tile 1 has an accent border (positive color mixed with the border color); all other tiles use the normal card border.
- Editable tiles are whole buttons (min. 44 px tap target, `aria-label` e.g. "Edytuj przychody") with a pencil icon in the top-right corner. Non-editable tiles are plain cards.
- Tiles have equal height within a row; long labels may wrap to two lines, values never wrap mid-amount.

### "Kategorie" card

- Header: title + "Edytuj" button (pencil, secondary pill button) → "Kategorie" sheet.
- One compact row per category: name (with a repeat icon for recurring categories), limit pill (percent mode) only for non-recurring categories at ≥ 80 %, a short progress bar, "spent / limit" right-aligned on two lines.
- Recurring categories are always 100 % used by design: lime bar, no warning pill.

### "Wydatki" card

- Header: title + total spent.
- Search input (icon inside, placeholder "Szukaj po nazwie lub notatce") filtering by name and note.
- Filter chips in one horizontally scrollable row (the row scrolls, never the page): "Wszystkie", "Wydatki cykliczne" (repeat icon), then each non-recurring category. One chip active at a time, active chip is lime.
- List: the "Wydatki cykliczne" group row first (repeat icon, "N pozycje · stałe co miesiąc", total, chevron). Tapping it expands the individual recurring expenses indented under it (left border line); collapsed by default. Then the regular expenses (`ExpenseRow`), newest first.
- "Wydatki cykliczne" chip shows only the recurring group (expanded).
- Tapping a regular expense opens the "Edytuj wydatek" sheet (same fields as "Dodaj wydatek" + "Usuń"). Recurring expenses are not edited individually: their amount follows the category limit (edit it in the "Kategorie" sheet).

### Sheets and dialogs

Mobile: bottom sheet (rounded top corners, grabber, title + close "×" button, scrollable body, footer with "Anuluj" (1/3) and the primary action (2/3), 50 px buttons, respects `safe-area-inset-bottom`, dimmed backdrop). Desktop: the same content as a centered dialog (~460 px wide). Amount inputs are large, `inputmode="decimal"`, comma accepted (`parseAmount`).

| Sheet | Opened from | Content | Primary action |
|---|---|---|---|
| **Przychody** | tile "Przychody" | "Wypłata" amount field; "Dodatkowe przychody" list (name, date, +amount, edit and delete icon buttons, 44 px each); "+ Dodaj przychód" button; "Przychody razem" total | "Zapisz" (salary) |
| **Dodaj przychód** / **Edytuj przychód** | "Przychody" sheet | Nazwa, Kwota, Data; hint with the new total income | "Dodaj przychód" / "Zapisz" |
| **Edytuj budżet** | tile "Budżet" | budget amount; hint "Przychody X → cel oszczędnościowy Y" and the sum of category limits; warning if budget > total income or limits > budget | "Zapisz" |
| **Kategorie** | "Edytuj" in "Kategorie" card | per category: name, limit, checkbox "Wydatek cykliczny", delete; "+ Dodaj kategorię" | "Zapisz" |
| **Dodaj wydatek** / **Edytuj wydatek** | floating "+" (mobile), "+ Dodaj wydatek" (desktop), expense row | Nazwa, Kwota, Kategoria + Data (two columns), Notatka; existing inline over-limit warning | "Dodaj wydatek" / "Zapisz" (+ "Usuń" in edit) |
| **Zamknąć {miesiąc}?** (dialog, centered on all sizes) | "Zamknij miesiąc" | "Miesiąc stanie się tylko do odczytu i zobaczysz jego podsumowanie. Możesz go później otworzyć ponownie." | "Zamknij miesiąc" |

### Closed month

- Top: closed banner (lock icon, "Zamknięty {data}") with a primary "Otwórz ponownie" button (replaces the Stage 2 `MonthClosedNotice` layout).
- Tile grid with the summary, same tile component, no pencils, in this order: **Przychody razem** (salary + each extra income in the sub-line), **Wydano** ("X % budżetu"), **Zaoszczędzono** (total income − spent, bar by goal %), **Cel oszczędnościowy** (closed-month formula, pill + "Cel zrealizowany" / "Ponad cel"), **Budżet** (pill "▲ Przekroczony o X" when spent > budget), **Limity**.
- "Przekroczone limity" card: one row per exceeded category with a red bar and "+X" over "limit Y".
- Below: the "Kategorie" and "Wydatki" cards read-only (no "Edytuj", no sheets, search and filter still work). No floating "+", no "Zamknij miesiąc".

### Navigation and mobile behavior

- Desktop sidebar has a single item "Mój miesiąc". No bottom tab bar on mobile.
- Month switcher without a month list or range limit: ‹ › move one month in either direction, tapping the month label jumps back to the current month. Desktop: "‹ paź 2026 ›" in the header. Mobile: "‹ Październik 2026 ›" replaces the page title (44 px arrows); swiping the mobile header left / right goes to the next / previous month. Months without data show "Zacznij kontrolę budżetu".
- Floating "+": 58 px lime square (radius 18 px), bottom-right, `right: max(16px, safe-area-inset-right)`, `bottom: 18px + safe-area-inset-bottom`. Page bottom padding (~100 px + safe area) keeps it from covering the last content.
- No horizontal page scroll at 360–430 px; only the chip row scrolls horizontally.
- All tap targets ≥ 44 px (icon buttons in rows 44 × 44, chips 36 px high inside a 44 px row).
