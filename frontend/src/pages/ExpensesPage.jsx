import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import ExpenseRow from "../components/ExpenseRow";
import Notice from "../components/Notice";
import Panel, { PanelHeader } from "../components/Panel";
import RowActions from "../components/RowActions";
import { useScrollIntoView } from "../hooks/useScrollIntoView";
import { formatExpenseAmount, formatMoney, formatMonthName, plural } from "../utils/format";

function CategoryOptions({ categories }) {
  return (
    <>
      <option value="">Wybierz kategorię</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name} (limit {formatMoney(category.limit_amount)})
        </option>
      ))}
    </>
  );
}

export default function ExpensesPage({ form, data, selectedMonth, formMessage, focusAddForm, onAddFormFocused }) {
  const { categories, expenses, loadingExpenses, expensesError, loadExpenses } = data;

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => String(expense.expense_date).slice(0, 7) === selectedMonth.slice(0, 7)),
    [expenses, selectedMonth],
  );
  const monthCategories = useMemo(
    () => categories.filter((category) => category.month === selectedMonth),
    [categories, selectedMonth],
  );
  // The edited expense keeps its category in the list even if it belongs to another month.
  const editCategories = useMemo(() => {
    const current = categories.find((c) => String(c.id) === String(form.editingExpenseCategoryId));
    return current && !monthCategories.includes(current) ? [...monthCategories, current] : monthCategories;
  }, [categories, monthCategories, form.editingExpenseCategoryId]);

  const total = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const addRef = useRef(null);

  useEffect(() => {
    if (focusAddForm && addRef.current) {
      addRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      addRef.current.querySelector("select")?.focus({ preventScroll: true });
      onAddFormFocused();
    }
  }, [focusAddForm]);
  const editRef = useScrollIntoView(form.editingExpenseId);
  const isEditing = form.editingExpenseId !== null;

  return (
    <div className={isEditing ? "split has-edit" : "split"}>
      {isEditing && (
        <Panel className="split-edit card-editing" ref={editRef}>
          <PanelHeader title="Edytuj wydatek" />
          <form onSubmit={form.handleUpdateExpense} className="form-stack">
            <div className="field">
              <label htmlFor="edit-expense-category">Kategoria</label>
              <select
                id="edit-expense-category"
                className="input"
                value={form.editingExpenseCategoryId}
                onChange={(e) => form.setEditingExpenseCategoryId(e.target.value)}
                required
              >
                <CategoryOptions categories={editCategories} />
              </select>
            </div>
            <div className="field">
              <label htmlFor="edit-expense-name">Nazwa</label>
              <input
                id="edit-expense-name"
                className="input"
                type="text"
                value={form.editingExpenseName}
                onChange={(e) => form.setEditingExpenseName(e.target.value)}
                required
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="edit-expense-amount">Kwota (zł)</label>
                <input
                  id="edit-expense-amount"
                  className="input"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={form.editingExpenseAmount}
                  onChange={(e) => form.setEditingExpenseAmount(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="edit-expense-date">Data</label>
                <input
                  id="edit-expense-date"
                  className="input"
                  type="date"
                  value={form.editingExpenseDate}
                  onChange={(e) => form.setEditingExpenseDate(e.target.value)}
                  required
                />
              </div>
            </div>
            {form.editWarning && <Notice tone="warning">{form.editWarning}</Notice>}
            <div className="field">
              <label htmlFor="edit-expense-notes">Notatki</label>
              <textarea
                id="edit-expense-notes"
                className="input textarea"
                value={form.editingExpenseNotes}
                onChange={(e) => form.setEditingExpenseNotes(e.target.value)}
              />
            </div>
            <div className="button-row">
              <button className="btn btn-primary" type="submit">
                Zapisz wydatek
              </button>
              <button className="btn btn-secondary" type="button" onClick={form.cancelExpenseEdit}>
                Anuluj
              </button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="split-list">
        <PanelHeader
          title={`Wydatki – ${formatMonthName(selectedMonth).toLowerCase()}`}
          action={
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadExpenses}>
              <RefreshCw size={14} aria-hidden="true" />
              Odśwież
            </button>
          }
        />
        {monthExpenses.length > 0 && (
          <p className="list-summary muted">
            {monthExpenses.length} {plural(monthExpenses.length, "wydatek", "wydatki", "wydatków")} · razem{" "}
            <b className="negative">{formatExpenseAmount(total)}</b>
          </p>
        )}

        {loadingExpenses && <p className="muted">Ładowanie wydatków...</p>}
        {expensesError && <Notice tone="error">{expensesError}</Notice>}
        {!loadingExpenses && !expensesError && monthExpenses.length === 0 && (
          <p className="muted">Brak wydatków w tym miesiącu.</p>
        )}

        {!loadingExpenses && !expensesError && monthExpenses.length > 0 && (
          <div className="expense-list">
            {monthExpenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                actions={
                  <RowActions
                    onEdit={() => form.startExpenseEdit(expense)}
                    onDelete={() => form.handleDeleteExpense(expense.id)}
                  />
                }
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel className="split-add" ref={addRef}>
        <PanelHeader title="Dodaj wydatek" />
        <form onSubmit={form.handleCreateExpense} className="form-stack">
          <div className="field">
            <label htmlFor="expense-category">Kategoria</label>
            <select
              id="expense-category"
              className="input"
              value={form.expenseCategoryId}
              onChange={(e) => form.setExpenseCategoryId(e.target.value)}
              required
            >
              <CategoryOptions categories={monthCategories} />
            </select>
            {monthCategories.length === 0 && (
              <span className="field-hint">Najpierw dodaj kategorię w tym miesiącu.</span>
            )}
          </div>
          <div className="field">
            <label htmlFor="expense-name">Nazwa wydatku</label>
            <input
              id="expense-name"
              className="input"
              type="text"
              placeholder="Np. Zakupy w Biedronce"
              value={form.expenseName}
              onChange={(e) => form.setExpenseName(e.target.value)}
              required
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="expense-amount">Kwota (zł)</label>
              <input
                id="expense-amount"
                className="input"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                placeholder="Np. 49.99"
                value={form.expenseAmount}
                onChange={(e) => form.setExpenseAmount(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="expense-date">Data wydatku</label>
              <input
                id="expense-date"
                className="input"
                type="date"
                value={form.expenseDate}
                onChange={(e) => form.setExpenseDate(e.target.value)}
                required
              />
            </div>
          </div>
          {form.addWarning && <Notice tone="warning">{form.addWarning}</Notice>}
          <div className="field">
            <label htmlFor="expense-notes">Notatki</label>
            <textarea
              id="expense-notes"
              className="input textarea"
              placeholder="Opcjonalna notatka"
              value={form.expenseNotes}
              onChange={(e) => form.setExpenseNotes(e.target.value)}
            />
          </div>

          {formMessage && (
            <Notice tone={formMessage.toLowerCase().includes("dodany") ? "success" : "error"}>
              {formMessage}
            </Notice>
          )}

          <button className="btn btn-primary btn-block" type="submit">
            Dodaj wydatek
          </button>
        </form>
      </Panel>
    </div>
  );
}
