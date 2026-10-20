import ExpenseRow from "../components/ExpenseRow";
import LimitPill from "../components/LimitPill";
import Panel, { PanelHeader } from "../components/Panel";
import ProgressBar from "../components/ProgressBar";
import { TABS } from "../constants";
import { limitState } from "../utils/budget";
import { formatMoney, formatPercent, plural } from "../utils/format";

function budgetState(usage) {
  if (usage > 100) return "exceeded";
  if (usage >= 80) return "warn";
  return "ok";
}

function CategoryUsageRow({ item }) {
  const spent = Number(item.spent_amount || 0);
  const limit = Number(item.category_limit || 0);
  const state = limitState(spent, limit);

  return (
    <div className="usage-row">
      <div className="usage-top">
        <span className="usage-name">
          {item.category_name}
          <span className="only-desktop">
            <LimitPill state={state} spent={spent} limit={limit} />
          </span>
        </span>
        <span className="usage-amount only-desktop">
          <b className="negative">{formatMoney(spent)}</b>
          <span className="muted"> / {formatMoney(limit)}</span>
        </span>
        <span className="only-mobile">
          {state === "ok" ? (
            <span className="muted usage-percent">{formatPercent(item.usage_percent)}</span>
          ) : (
            <LimitPill state={state} spent={spent} limit={limit} mode="percent" />
          )}
        </span>
      </div>
      <ProgressBar percent={item.usage_percent} state={state} label={`${item.category_name}: wykorzystanie limitu`} />
      <div className="usage-bottom only-mobile muted">
        <span>{formatMoney(spent)}</span>
        <span>z {formatMoney(limit)}</span>
      </div>
    </div>
  );
}

export default function DashboardPage({ overview, loadingOverview, monthExpenses, onNavigate }) {
  if (!overview) {
    return <p className="muted">{loadingOverview ? "Ładowanie..." : "Brak danych dla wybranego miesiąca."}</p>;
  }

  const hasBudget = overview.budget_id !== null;
  const usage = Number(overview.budget_usage_percent || 0);
  const remaining = Number(overview.remaining_budget || 0);
  const categories = overview.categories || [];
  const exceeded = categories.filter((item) => item.is_limit_exceeded);
  const recent = monthExpenses.slice(0, 5);

  return (
    <div className="dashboard">
      <div className="kpis">
        <Panel className="kpi kpi-hero">
          <span className="kpi-label">Pozostało do wydania</span>
          {hasBudget ? (
            <>
              <span className={`kpi-value ${remaining < 0 ? "exceeded-text" : "positive"}`}>
                {formatMoney(remaining)}
              </span>
              <ProgressBar percent={usage} state={budgetState(usage)} label="Wykorzystanie budżetu" />
              <span className="kpi-sub only-desktop">Wykorzystano {formatPercent(usage)} budżetu</span>
              <span className="kpi-sub kpi-split only-mobile">
                <span>Wydano {formatPercent(usage)}</span>
                <span>z {formatMoney(overview.total_budget)}</span>
              </span>
            </>
          ) : (
            <>
              <span className="kpi-value muted">Brak budżetu</span>
              <button type="button" className="link-btn" onClick={() => onNavigate(TABS.BUDGETS)}>
                Ustaw budżet na ten miesiąc →
              </button>
            </>
          )}
        </Panel>

        <Panel className="kpi kpi-budget">
          <span className="kpi-label">
            Budżet<span className="only-desktop"> miesiąca</span>
          </span>
          <span className="kpi-value">{formatMoney(overview.total_budget)}</span>
          <span className="kpi-sub only-desktop">
            {overview.category_count} {plural(overview.category_count, "kategoria", "kategorie", "kategorii")}
          </span>
        </Panel>

        <Panel className="kpi kpi-spent">
          <span className="kpi-label">Wydano</span>
          <span className="kpi-value negative">{formatMoney(overview.total_spent)}</span>
          <span className="kpi-sub only-desktop">
            {overview.expense_count} {plural(overview.expense_count, "wydatek", "wydatki", "wydatków")}
          </span>
        </Panel>

        <Panel className="kpi kpi-limits only-desktop">
          <span className="kpi-label">Limity</span>
          <span className="kpi-value">
            {exceeded.length} / {categories.length}
          </span>
          {exceeded.length > 0 ? (
            <span className="pill pill-exceeded">
              <span aria-hidden="true">▲</span>
              {exceeded.length} {plural(exceeded.length, "przekroczony", "przekroczone", "przekroczonych")}
            </span>
          ) : (
            <span className="pill pill-neutral">
              <span aria-hidden="true">✓</span>
              Wszystkie w normie
            </span>
          )}
        </Panel>
      </div>

      {exceeded.length > 0 && (
        <div className="alerts only-mobile">
          {exceeded.map((item) => (
            <div key={item.category_id} className="alert-row">
              <span aria-hidden="true">▲</span>
              {item.category_name}: limit przekroczony o {formatMoney(item.spent_amount - item.category_limit)}
            </div>
          ))}
        </div>
      )}

      <div className="dash-cols">
        <Panel className="section">
          <PanelHeader
            title="Kategorie"
            action={<span className="pill pill-neutral only-desktop">Wydano / limit</span>}
          />
          {categories.length === 0 ? (
            <div className="empty">
              <p className="muted">Brak kategorii w tym miesiącu.</p>
              <button type="button" className="link-btn" onClick={() => onNavigate(TABS.CATEGORIES)}>
                Dodaj kategorię →
              </button>
            </div>
          ) : (
            <div className="usage-list">
              {categories.map((item) => (
                <CategoryUsageRow key={item.category_id} item={item} />
              ))}
            </div>
          )}
        </Panel>

        <Panel className="section">
          <PanelHeader
            title="Ostatnie wydatki"
            action={
              <button type="button" className="link-btn" onClick={() => onNavigate(TABS.EXPENSES)}>
                Wszystkie →
              </button>
            }
          />
          {recent.length === 0 ? (
            <p className="muted">Brak wydatków w tym miesiącu.</p>
          ) : (
            <div className="expense-list">
              {recent.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} />
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
