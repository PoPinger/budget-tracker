import Notice from "../components/Notice";
import MonthInput from "../components/MonthInput";
import Panel, { PanelHeader } from "../components/Panel";
import ProgressBar from "../components/ProgressBar";
import RowActions from "../components/RowActions";
import { useScrollIntoView } from "../hooks/useScrollIntoView";
import { formatMoney, formatMonthTitle, formatPercent } from "../utils/format";

// One budget per month: shows the selected month's budget card, or the form to set it.
export default function BudgetsPage({ form, data, selectedMonth, formMessage }) {
  const { budgets, loadingBudgets, budgetsError, overview } = data;
  const budget = budgets.find((item) => item.month === selectedMonth);
  const monthLabel = formatMonthTitle(selectedMonth).toLowerCase();

  const spent = Number(overview?.total_spent || 0);
  const usage = budget ? (spent / Number(budget.total_limit)) * 100 : 0;
  const remaining = budget ? Number(budget.total_limit) - spent : 0;
  const editRef = useScrollIntoView(form.editingBudgetId);
  const isEditing = form.editingBudgetId !== null;

  return (
    <div className="budget-page">
      {loadingBudgets && <p className="muted">Ładowanie budżetów...</p>}
      {budgetsError && <Notice tone="error">{budgetsError}</Notice>}

      {!loadingBudgets && !budgetsError && budget && (
        <Panel className="budget-card">
          <span className="kpi-label">Budżet na {monthLabel}</span>
          <span className="budget-amount">{formatMoney(budget.total_limit)}</span>
          <ProgressBar
            percent={usage}
            state={usage > 100 ? "exceeded" : usage >= 80 ? "warn" : "ok"}
            label="Wykorzystanie budżetu"
          />
          <div className="budget-stats">
            <span>
              Wydano <b className="negative">{formatMoney(spent)}</b> ({formatPercent(usage)})
            </span>
            <span>
              Pozostało{" "}
              <b className={remaining < 0 ? "exceeded-text" : "positive"}>{formatMoney(remaining)}</b>
            </span>
          </div>
          <div className="row-actions">
            <RowActions onEdit={() => form.startBudgetEdit(budget)} onDelete={() => form.handleDeleteBudget(budget.id)} />
          </div>
        </Panel>
      )}

      {isEditing && (
        <Panel className="card-editing form-card" ref={editRef}>
          <PanelHeader title="Edytuj budżet" />
          <form onSubmit={form.handleUpdateBudget} className="form-stack">
            <div className="field-row">
              <div className="field">
                <label htmlFor="edit-budget-amount">Kwota (zł)</label>
                <input
                  id="edit-budget-amount"
                  className="input"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.01"
                  value={form.editingBudgetAmount}
                  onChange={(e) => form.setEditingBudgetAmount(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="edit-budget-month">Miesiąc</label>
                <MonthInput id="edit-budget-month" value={form.editingBudgetMonth} onChange={form.setEditingBudgetMonth} />
              </div>
            </div>
            <div className="button-row">
              <button className="btn btn-primary" type="submit">
                Zapisz budżet
              </button>
              <button className="btn btn-secondary" type="button" onClick={form.cancelBudgetEdit}>
                Anuluj
              </button>
            </div>
          </form>
        </Panel>
      )}

      {!loadingBudgets && !budgetsError && !budget && (
        <Panel className="form-card">
          <PanelHeader title={`Ustaw budżet na ${monthLabel}`} />
          <p className="muted card-intro">Budżet to kwota, którą chcesz wydać w tym miesiącu. Pulpit pokaże, ile z niej zostało.</p>
          <form onSubmit={form.handleCreateBudget} className="form-stack">
            <div className="field-row">
              <div className="field">
                <label htmlFor="budget-amount">Kwota budżetu (zł)</label>
                <input
                  id="budget-amount"
                  className="input"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.01"
                  placeholder="Np. 3000"
                  value={form.budgetAmount}
                  onChange={(e) => form.setBudgetAmount(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="budget-month">Miesiąc</label>
                <MonthInput id="budget-month" value={form.budgetMonth} onChange={form.setBudgetMonth} />
              </div>
            </div>
            <button className="btn btn-primary btn-block" type="submit">
              Ustaw budżet
            </button>
          </form>
        </Panel>
      )}

      {formMessage && (
        <Notice tone={formMessage.toLowerCase().includes("dodany") ? "success" : "error"}>{formMessage}</Notice>
      )}
    </div>
  );
}
