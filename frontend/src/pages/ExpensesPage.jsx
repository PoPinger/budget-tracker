import { useMemo } from "react";
import Notice from "../components/Notice";
import Panel, { PanelHeader } from "../components/Panel";
import { formatMoney } from "../utils/format";

function CategoryOptions({ categories }) {
  return (
    <>
      <option value="">Wybierz kategorię</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name} ({formatMoney(category.limit_amount)})
        </option>
      ))}
    </>
  );
}

export default function ExpensesPage({ form, data, selectedMonth, formMessage }) {
  const { categories, expenses, loadingExpenses, expensesError, loadExpenses } = data;

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseMonth = String(expense.expense_date).slice(0, 7);
      const selectedMonthShort = String(selectedMonth).slice(0, 7);
      return expenseMonth === selectedMonthShort;
    });
  }, [expenses, selectedMonth]);

  return (
    <section className="content-grid">
      <Panel>
        <h2>Dodaj wydatek</h2>

        <form onSubmit={form.handleCreateExpense} className="form-stack">
          <label className="form-label">
            Kategoria
            <select
              className="input"
              value={form.expenseCategoryId}
              onChange={(e) => form.setExpenseCategoryId(e.target.value)}
              required
            >
              <CategoryOptions categories={categories} />
            </select>
          </label>

          <label className="form-label">
            Nazwa wydatku
            <input
              className="input"
              type="text"
              placeholder="Np. Zakupy w Biedronce"
              value={form.expenseName}
              onChange={(e) => form.setExpenseName(e.target.value)}
              required
            />
          </label>

          <label className="form-label">
            Kwota
            <input
              className="input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Np. 49.99"
              value={form.expenseAmount}
              onChange={(e) => form.setExpenseAmount(e.target.value)}
              required
            />
          </label>

          <label className="form-label">
            Data wydatku
            <input
              className="input"
              type="date"
              value={form.expenseDate}
              onChange={(e) => form.setExpenseDate(e.target.value)}
              required
            />
          </label>

          <label className="form-label">
            Notatki
            <textarea
              className="input textarea"
              placeholder="Opcjonalna notatka"
              value={form.expenseNotes}
              onChange={(e) => form.setExpenseNotes(e.target.value)}
            />
          </label>

          {formMessage && (
            <Notice tone={formMessage.toLowerCase().includes("dodany") ? "success" : "error"}>
              {formMessage}
            </Notice>
          )}

          <button className="primary-btn" type="submit">
            Dodaj wydatek
          </button>
        </form>

        {form.editingExpenseId !== null && (
          <>
            <div className="divider" />
            <h3>Edytuj wydatek</h3>

            <form onSubmit={form.handleUpdateExpense} className="form-stack">
              <label className="form-label">
                Kategoria
                <select
                  className="input"
                  value={form.editingExpenseCategoryId}
                  onChange={(e) => form.setEditingExpenseCategoryId(e.target.value)}
                  required
                >
                  <CategoryOptions categories={categories} />
                </select>
              </label>

              <label className="form-label">
                Nazwa
                <input
                  className="input"
                  type="text"
                  value={form.editingExpenseName}
                  onChange={(e) => form.setEditingExpenseName(e.target.value)}
                  required
                />
              </label>

              <label className="form-label">
                Kwota
                <input
                  className="input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.editingExpenseAmount}
                  onChange={(e) => form.setEditingExpenseAmount(e.target.value)}
                  required
                />
              </label>

              <label className="form-label">
                Data
                <input
                  className="input"
                  type="date"
                  value={form.editingExpenseDate}
                  onChange={(e) => form.setEditingExpenseDate(e.target.value)}
                  required
                />
              </label>

              <label className="form-label">
                Notatki
                <textarea
                  className="input textarea"
                  value={form.editingExpenseNotes}
                  onChange={(e) => form.setEditingExpenseNotes(e.target.value)}
                />
              </label>

              <div className="button-row">
                <button className="primary-btn" type="submit">
                  Zapisz wydatek
                </button>
                <button className="secondary-btn" type="button" onClick={form.cancelExpenseEdit}>
                  Anuluj
                </button>
              </div>
            </form>
          </>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          title="Moje wydatki"
          action={
            <button className="primary-btn" onClick={loadExpenses}>
              Odśwież
            </button>
          }
        />

        {loadingExpenses && <p className="muted">Ładowanie wydatków...</p>}
        {expensesError && <Notice tone="error">{expensesError}</Notice>}
        {!loadingExpenses && !expensesError && filteredExpenses.length === 0 && (
          <p className="muted">Brak wydatków dla wybranego miesiąca.</p>
        )}

        {!loadingExpenses && !expensesError && filteredExpenses.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data</th>
                  <th>Nazwa</th>
                  <th>Kategoria</th>
                  <th>Kwota</th>
                  <th>Notatki</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.id}</td>
                    <td>{expense.expense_date}</td>
                    <td>{expense.name}</td>
                    <td>{expense.category_name}</td>
                    <td>{expense.amount}</td>
                    <td>{expense.notes || "-"}</td>
                    <td>
                      <div className="actions-inline">
                        <button className="edit-btn" onClick={() => form.startExpenseEdit(expense)}>
                          Edytuj
                        </button>
                        <button className="danger-btn" onClick={() => form.handleDeleteExpense(expense.id)}>
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
