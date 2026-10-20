import { useMemo } from "react";
import Notice from "../components/Notice";
import Panel, { PanelHeader } from "../components/Panel";

export default function BudgetsPage({ form, data, selectedMonth, formMessage }) {
  const { budgets, loadingBudgets, budgetsError, loadBudgets } = data;

  const filteredBudgets = useMemo(
    () => budgets.filter((budget) => budget.month === selectedMonth),
    [budgets, selectedMonth],
  );

  return (
    <section className="content-grid">
      <Panel>
        <h2>Dodaj budżet</h2>

        <form onSubmit={form.handleCreateBudget} className="form-stack">
          <label className="form-label">
            Miesiąc
            <input className="input" type="date" value={form.budgetMonth} onChange={(e) => form.setBudgetMonth(e.target.value)} required />
          </label>

          <label className="form-label">
            Kwota budżetu
            <input
              className="input"
              type="number"
              min="1"
              step="0.01"
              placeholder="Np. 3000"
              value={form.budgetAmount}
              onChange={(e) => form.setBudgetAmount(e.target.value)}
              required
            />
          </label>

          {formMessage && (
            <Notice tone={formMessage.toLowerCase().includes("dodany") ? "success" : "error"}>
              {formMessage}
            </Notice>
          )}

          <button className="primary-btn" type="submit">
            Dodaj budżet
          </button>
        </form>

        {form.editingBudgetId !== null && (
          <>
            <div className="divider" />
            <h3>Edytuj budżet</h3>

            <form onSubmit={form.handleUpdateBudget} className="form-stack">
              <label className="form-label">
                Miesiąc
                <input
                  className="input"
                  type="date"
                  value={form.editingBudgetMonth}
                  onChange={(e) => form.setEditingBudgetMonth(e.target.value)}
                  required
                />
              </label>

              <label className="form-label">
                Kwota
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.editingBudgetAmount}
                  onChange={(e) => form.setEditingBudgetAmount(e.target.value)}
                  required
                />
              </label>

              <div className="button-row">
                <button className="primary-btn" type="submit">
                  Zapisz budżet
                </button>
                <button className="secondary-btn" type="button" onClick={form.cancelBudgetEdit}>
                  Anuluj
                </button>
              </div>
            </form>
          </>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          title="Moje budżety"
          action={
            <button className="primary-btn" onClick={loadBudgets}>
              Odśwież
            </button>
          }
        />

        {loadingBudgets && <p className="muted">Ładowanie budżetów...</p>}
        {budgetsError && <Notice tone="error">{budgetsError}</Notice>}
        {!loadingBudgets && !budgetsError && filteredBudgets.length === 0 && (
          <p className="muted">Brak budżetów dla wybranego miesiąca.</p>
        )}

        {!loadingBudgets && !budgetsError && filteredBudgets.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Miesiąc</th>
                  <th>Kwota</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filteredBudgets.map((budget) => (
                  <tr key={budget.id}>
                    <td>{budget.id}</td>
                    <td>{budget.month}</td>
                    <td>{budget.total_limit}</td>
                    <td>
                      <div className="actions-inline">
                        <button className="edit-btn" onClick={() => form.startBudgetEdit(budget)}>
                          Edytuj
                        </button>
                        <button className="danger-btn" onClick={() => form.handleDeleteBudget(budget.id)}>
                          Usuń
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </section>
  );
}
