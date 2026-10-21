import { ChevronDown, Lock, Pencil, Repeat, Search, Target } from "lucide-react";
import ExpenseRow from "../components/ExpenseRow";
import LimitPill from "../components/LimitPill";
import Panel, { PanelHeader } from "../components/Panel";
import ProgressBar from "../components/ProgressBar";
import Tile from "../components/Tile";
import { budgetState, limitState, savingsGoal } from "../utils/budget";
import { formatExpenseAmount, formatMoney, formatPercent, plural } from "../utils/format";

const GOAL_PILL = {
  positive: { className: "pill-positive", icon: "✓" },
  warn: { className: "pill-warning", icon: "●" },
  exceeded: { className: "pill-exceeded", icon: "▲" },
};

function scrollToCategories() {
  document.getElementById("kategorie")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function GoalTile({ goal, closed }) {
  const pill = GOAL_PILL[goal.state];
  if (goal.percent === null) {
    return (
      <Tile label="Cel oszczędnościowy" icon={<Target size={16} aria-hidden="true" />} value={formatMoney(goal.goal)} valueClass="exceeded-text">
        <span className="pill pill-exceeded">
          <span aria-hidden="true">▲</span>Brak celu
        </span>
        <span className="tile-sub">
          {goal.goal < 0 ? `Budżet przekracza przychody o ${formatMoney(-goal.goal)}` : "Budżet jest równy przychodom"}
        </span>
      </Tile>
    );
  }
  return (
    <Tile label="Cel oszczędnościowy" icon={<Target size={16} aria-hidden="true" />} value={formatMoney(goal.goal)}>
      <span className={`pill ${pill.className}`}>
        <span aria-hidden="true">{pill.icon}</span>
        {formatPercent(goal.percent)}
      </span>
      <span className="tile-sub">
        {goal.percent > 100 ? "Ponad cel" : "Cel zrealizowany"}
        {closed ? "" : " · na dziś"}
      </span>
    </Tile>
  );
}

function LimitsTile({ exceededCount, categoryCount }) {
  return (
    <Tile label="Limity" value={`${exceededCount} / ${categoryCount}`} onClick={scrollToCategories}>
      {exceededCount > 0 ? (
        <span className="pill pill-exceeded">
          <span aria-hidden="true">▲</span>
          {exceededCount} {plural(exceededCount, "przekroczony", "przekroczone", "przekroczonych")}
        </span>
      ) : (
        <span className="pill pill-neutral">
          <span aria-hidden="true">✓</span>Wszystkie w normie
        </span>
      )}
    </Tile>
  );
}

function ActiveTiles({ overview, month, incomes, totals, goal, exceededCount, actions }) {
  const hasBudget = overview.budget_id !== null;
  const usage = Number(overview.budget_usage_percent || 0);
  const remaining = Number(overview.remaining_budget || 0);

  return (
    <div className="tiles">
      {hasBudget ? (
        <Tile
          label="Pozostało do wydania"
          value={formatMoney(remaining)}
          valueClass={remaining < 0 ? "exceeded-text" : "positive"}
          accent
        >
          <ProgressBar percent={usage} state={budgetState(usage)} label="Wykorzystanie budżetu" />
          <span className="tile-sub">Wydano {formatPercent(usage)} budżetu</span>
        </Tile>
      ) : (
        <Tile label="Pozostało do wydania" value="Brak budżetu" valueClass="muted" onClick={actions.onEditBudget} editLabel="Ustaw budżet" accent>
          <span className="tile-sub">Ustaw budżet na ten miesiąc</span>
        </Tile>
      )}
      <GoalTile goal={goal} closed={false} />
      <Tile
        label="Przychody"
        value={formatMoney(totals.totalIncome)}
        valueClass="positive"
        onClick={actions.onEditIncomes}
        editLabel="Edytuj przychody"
      >
        <span className="tile-sub">
          Wypłata {formatMoney(month?.salary)}
          <br />+ {incomes.length} {plural(incomes.length, "dodatkowy", "dodatkowe", "dodatkowych")}
        </span>
      </Tile>
      <Tile label="Budżet" value={formatMoney(overview.total_budget)} onClick={actions.onEditBudget} editLabel="Edytuj budżet">
        <span className="tile-sub">
          {totals.totalIncome > 0 ? `${formatPercent((totals.budget / totals.totalIncome) * 100)} przychodów` : "Brak przychodów"}
        </span>
      </Tile>
      <Tile label="Wydano" value={formatMoney(overview.total_spent)} valueClass="negative">
        <span className="tile-sub">
          {overview.expense_count} {plural(overview.expense_count, "wydatek", "wydatki", "wydatków")}
        </span>
      </Tile>
      <LimitsTile exceededCount={exceededCount} categoryCount={overview.categories.length} />
    </div>
  );
}

function ClosedTiles({ overview, month, incomes, totals, goal, exceededCount }) {
  const usage = Number(overview.budget_usage_percent || 0);
  const overBudget = totals.spent - totals.budget;
  const savedState = goal.percent === null ? "exceeded" : goal.state === "positive" ? "ok" : goal.state;

  return (
    <div className="tiles">
      <Tile label="Przychody razem" value={formatMoney(totals.totalIncome)} valueClass="positive">
        <span className="tile-sub">
          Wypłata {formatMoney(month?.salary)}
          {incomes.map((income) => (
            <span key={income.id} className="tile-sub-line">
              + {income.name} {formatMoney(income.amount)}
            </span>
          ))}
        </span>
      </Tile>
      <Tile label="Wydano" value={formatMoney(totals.spent)} valueClass="negative">
        <span className="tile-sub">{formatPercent(usage)} budżetu</span>
      </Tile>
      <Tile
        label="Zaoszczędzono"
        value={formatMoney(goal.saved)}
        valueClass={goal.saved < 0 ? "exceeded-text" : ""}
        accent
      >
        <ProgressBar percent={goal.percent ?? 0} state={savedState} label="Realizacja celu oszczędnościowego" />
        <span className="tile-sub">Przychody − wydatki</span>
      </Tile>
      <GoalTile goal={goal} closed />
      <Tile label="Budżet" value={formatMoney(totals.budget)}>
        {overBudget > 0 ? (
          <>
            <span className="pill pill-exceeded">
              <span aria-hidden="true">▲</span>+{formatMoney(overBudget)}
            </span>
            <span className="tile-sub">Budżet przekroczony</span>
          </>
        ) : (
          <>
            <span className="pill pill-positive">
              <span aria-hidden="true">✓</span>W budżecie
            </span>
            <span className="tile-sub">Zostało {formatMoney(-overBudget)}</span>
          </>
        )}
      </Tile>
      <LimitsTile exceededCount={exceededCount} categoryCount={overview.categories.length} />
    </div>
  );
}

function ExceededCard({ categories }) {
  return (
    <Panel>
      <PanelHeader title="Przekroczone limity" />
      <div className="cat-lines">
        {categories.map((item) => (
          <div key={item.category_id} className="cat-line">
            <span className="cat-line-name">{item.category_name}</span>
            <ProgressBar percent={100} state="exceeded" label={`${item.category_name}: limit przekroczony`} />
            <span className="cat-line-nums">
              <b className="exceeded-text">+{formatMoney(item.spent_amount - item.category_limit)}</b>
              <span className="muted">limit {formatMoney(item.category_limit)}</span>
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CategoriesCard({ categories, recurringIds, readOnly, onEdit }) {
  return (
    <Panel id="kategorie">
      <PanelHeader
        title="Kategorie"
        action={
          !readOnly && (
            <button type="button" className="edit-btn" onClick={onEdit}>
              <Pencil size={15} aria-hidden="true" />
              Edytuj
            </button>
          )
        }
      />
      {categories.length === 0 ? (
        <div className="empty">
          <p className="muted">Brak kategorii w tym miesiącu.</p>
          {!readOnly && (
            <button type="button" className="link-btn" onClick={onEdit}>
              Dodaj kategorię →
            </button>
          )}
        </div>
      ) : (
        <div className="cat-lines">
          {categories.map((item) => {
            const spent = Number(item.spent_amount || 0);
            const limit = Number(item.category_limit || 0);
            const recurring = recurringIds.has(item.category_id);
            // A recurring category is 100 % used by design: lime bar, no warning pill.
            const state = recurring ? "ok" : limitState(spent, limit);
            return (
              <div key={item.category_id} className="cat-line">
                <span className="cat-line-name">
                  {recurring && <Repeat size={14} aria-label="Wydatek cykliczny" />}
                  <span className="cat-line-text">{item.category_name}</span>
                  <LimitPill state={state} spent={spent} limit={limit} mode="percent" />
                </span>
                <ProgressBar percent={item.usage_percent} state={state} label={`${item.category_name}: wykorzystanie limitu`} />
                <span className="cat-line-nums">
                  <b>{formatMoney(spent)}</b>
                  <span className="muted">/ {formatMoney(limit)}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function ExpensesCard({ expenses, categories, filters, totalSpent, onEditExpense }) {
  const query = filters.search.trim().toLowerCase();
  const matches = (expense) =>
    !query || `${expense.name} ${expense.notes || ""}`.toLowerCase().includes(query);

  const allRecurring = expenses.filter((expense) => expense.is_recurring);
  const recurring = allRecurring.filter(matches);
  const regular = expenses.filter(
    (expense) =>
      !expense.is_recurring &&
      matches(expense) &&
      (filters.filter === "all" || String(expense.category_id) === String(filters.filter)),
  );
  const showRecurring = recurring.length > 0 && (filters.filter === "all" || filters.filter === "recurring");
  const showRegular = filters.filter !== "recurring";
  const recurringOpen = filters.recurringOpen || filters.filter === "recurring" || Boolean(query);
  const recurringTotal = recurring.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const chips = [
    { value: "all", label: "Wszystkie" },
    ...(allRecurring.length ? [{ value: "recurring", label: "Wydatki cykliczne", icon: true }] : []),
    ...categories.filter((category) => !category.is_recurring).map((category) => ({ value: String(category.id), label: category.name })),
  ];
  const isEmpty = !showRecurring && (!showRegular || regular.length === 0);

  return (
    <Panel>
      <PanelHeader title="Wydatki" action={<b className="negative">{formatExpenseAmount(totalSpent)}</b>} />
      <div className="search-box">
        <Search size={17} aria-hidden="true" />
        <input
          className="input search-input"
          type="search"
          placeholder="Szukaj po nazwie lub notatce"
          aria-label="Szukaj wydatków"
          value={filters.search}
          onChange={(event) => filters.setSearch(event.target.value)}
        />
      </div>
      <div className="chip-row" role="group" aria-label="Filtruj według kategorii">
        {chips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={filters.filter === chip.value ? "filter-chip on" : "filter-chip"}
            aria-pressed={filters.filter === chip.value}
            onClick={() => filters.setFilter(chip.value)}
          >
            {chip.icon && <Repeat size={14} aria-hidden="true" />}
            {chip.label}
          </button>
        ))}
      </div>

      {isEmpty ? (
        <p className="muted expenses-empty">
          {expenses.length === 0 ? "Brak wydatków w tym miesiącu." : "Brak wydatków pasujących do wyszukiwania."}
        </p>
      ) : (
        <div className="expense-list">
          {showRecurring && (
            <div className={recurringOpen ? "rec-group open" : "rec-group"}>
              <button type="button" className="rec-head" aria-expanded={recurringOpen} onClick={filters.toggleRecurring}>
                <span className="expense-avatar rec-icon" aria-hidden="true">
                  <Repeat size={16} />
                </span>
                <span className="expense-main">
                  <span className="expense-name">Wydatki cykliczne</span>
                  <span className="expense-meta">
                    {recurring.length} {plural(recurring.length, "pozycja", "pozycje", "pozycji")} · stałe co miesiąc
                  </span>
                </span>
                <span className="expense-amount negative">{formatExpenseAmount(recurringTotal)}</span>
                <ChevronDown size={18} className="chev" aria-hidden="true" />
              </button>
              {recurringOpen && (
                <div className="rec-items">
                  {recurring.map((expense) => (
                    <ExpenseRow key={expense.id} expense={expense} />
                  ))}
                </div>
              )}
            </div>
          )}
          {showRegular &&
            regular.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                onClick={onEditExpense ? () => onEditExpense(expense) : undefined}
              />
            ))}
        </div>
      )}
    </Panel>
  );
}

// "Mój miesiąc": tile grid + categories + expenses. readOnly (closed month): summary tiles, no editing.
export default function DashboardPage({
  overview,
  loadingOverview,
  month,
  incomes,
  monthCategories,
  monthExpenses,
  totals,
  filters,
  readOnly = false,
  actions,
}) {
  if (!overview) {
    return <p className="muted">{loadingOverview ? "Ładowanie..." : "Brak danych dla wybranego miesiąca."}</p>;
  }

  const goal = savingsGoal({ ...totals, closed: readOnly });
  const exceeded = overview.categories.filter((item) => item.is_limit_exceeded);
  const recurringIds = new Set(monthCategories.filter((category) => category.is_recurring).map((category) => category.id));
  const tileProps = { overview, month, incomes, totals, goal, exceededCount: exceeded.length };

  return (
    <div className="dashboard">
      {readOnly ? <ClosedTiles {...tileProps} /> : <ActiveTiles {...tileProps} actions={actions} />}
      {readOnly && exceeded.length > 0 && <ExceededCard categories={exceeded} />}

      <div className="dash-cols">
        <CategoriesCard
          categories={overview.categories}
          recurringIds={recurringIds}
          readOnly={readOnly}
          onEdit={actions.onEditCategories}
        />
        <ExpensesCard
          expenses={monthExpenses}
          categories={monthCategories}
          filters={filters}
          totalSpent={overview.total_spent}
          onEditExpense={readOnly ? undefined : actions.onEditExpense}
        />
      </div>

      {!readOnly && (
        <button type="button" className="btn btn-secondary btn-block btn-lg close-month-btn only-mobile" onClick={actions.onCloseMonth}>
          <Lock size={16} aria-hidden="true" />
          Zamknij miesiąc
        </button>
      )}
    </div>
  );
}
