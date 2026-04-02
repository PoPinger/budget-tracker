import { useEffect, useMemo, useState } from "react";
import { getCategories } from "../api/categories";
import { createExpense, deleteExpense, getExpenses } from "../api/expenses";
import type { CategoryResponse } from "../types/category";
import type {
  ExpenseCreate,
  ExpenseWithCategoryResponse,
} from "../types/expense";

type FormState = {
  title: string;
  amount: string;
  expense_date: string;
  notes: string;
  category_id: string;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(value);
}

function getCurrentMonthValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}-01`;
}

const initialFormState = (): FormState => ({
  title: "",
  amount: "",
  expense_date: getCurrentMonthValue(),
  notes: "",
  category_id: "",
});

export default function ExpensesPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthValue());
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [expenses, setExpenses] = useState<ExpenseWithCategoryResponse[]>([]);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const selectedYear = useMemo(
    () => Number(selectedMonth.slice(0, 4)),
    [selectedMonth]
  );
  const selectedMonthNumber = useMemo(
    () => Number(selectedMonth.slice(5, 7)),
    [selectedMonth]
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [categoriesData, expensesData] = await Promise.all([
          getCategories(),
          getExpenses(selectedYear, selectedMonthNumber),
        ]);

        setCategories(
          categoriesData.filter((category) => category.month === selectedMonth)
        );
        setExpenses(expensesData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Nie udało się pobrać danych wydatków.");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [selectedMonth, selectedYear, selectedMonthNumber]);

  useEffect(() => {
    setForm((previous) => ({
      ...previous,
      expense_date: selectedMonth,
    }));
  }, [selectedMonth]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const refreshExpenses = async () => {
    const expensesData = await getExpenses(selectedYear, selectedMonthNumber);
    setExpenses(expensesData);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.category_id) {
      setError("Wybierz kategorię.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const payload: ExpenseCreate = {
        title: form.title.trim(),
        amount: Number(form.amount),
        expense_date: form.expense_date,
        notes: form.notes.trim() ? form.notes.trim() : null,
        category_id: Number(form.category_id),
      };

      await createExpense(payload);
      await refreshExpenses();

      setForm({
        title: "",
        amount: "",
        expense_date: selectedMonth,
        notes: "",
        category_id: "",
      });

      setSuccessMessage("Wydatek został dodany.");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się dodać wydatku.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    const confirmed = window.confirm("Czy na pewno chcesz usunąć ten wydatek?");
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      await deleteExpense(expenseId);
      await refreshExpenses();
      setSuccessMessage("Wydatek został usunięty.");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się usunąć wydatku.");
      }
    }
  };

  return (
    <div className="page">
      <div className="page-header page-header--row">
        <div>
          <h1>Wydatki</h1>
          <p>Dodawanie wydatków i historia operacji dla wybranego miesiąca.</p>
        </div>

        <div className="month-picker">
          <label htmlFor="expenses-month">Miesiąc</label>
          <input
            id="expenses-month"
            type="month"
            value={selectedMonth.slice(0, 7)}
            onChange={(event) => {
              setSelectedMonth(`${event.target.value}-01`);
            }}
          />
        </div>
      </div>

      <section className="card">
        <div className="section-header">
          <div>
            <h3>Dodaj wydatek</h3>
            <p className="muted">Wydatek zostanie przypisany do wybranej kategorii.</p>
          </div>
        </div>

        {error && <div className="alert alert--error">{error}</div>}
        {successMessage && <div className="alert alert--success">{successMessage}</div>}

        <form className="expense-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="title">Nazwa wydatku</label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder="Np. Zakupy spożywcze"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="amount">Kwota</label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={handleInputChange}
                placeholder="Np. 49.99"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="expense_date">Data wydatku</label>
              <input
                id="expense_date"
                name="expense_date"
                type="date"
                value={form.expense_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="category_id">Kategoria</label>
              <select
                id="category_id"
                name="category_id"
                value={form.category_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Wybierz kategorię</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} — limit {formatCurrency(Number(category.limit_amount))}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="notes">Notatki</label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleInputChange}
              placeholder="Opcjonalny opis wydatku"
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button
              className="primary-button"
              type="submit"
              disabled={saving || categories.length === 0}
            >
              {saving ? "Zapisywanie..." : "Dodaj wydatek"}
            </button>
          </div>

          {categories.length === 0 && (
            <p className="muted">
              Dla wybranego miesiąca nie ma kategorii. Najpierw dodaj kategorie dla tego
              miesiąca.
            </p>
          )}
        </form>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h3>Historia wydatków</h3>
            <p className="muted">Lista wydatków dla wybranego miesiąca.</p>
          </div>
        </div>

        {loading ? (
          <p>Ładowanie wydatków...</p>
        ) : expenses.length === 0 ? (
          <div className="empty-state">Brak wydatków w wybranym miesiącu.</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Nazwa</th>
                  <th>Kategoria</th>
                  <th>Kwota</th>
                  <th>Notatki</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.expense_date}</td>
                    <td>{expense.title}</td>
                    <td>{expense.category_name}</td>
                    <td>{formatCurrency(Number(expense.amount))}</td>
                    <td>{expense.notes || "-"}</td>
                    <td>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => void handleDeleteExpense(expense.id)}
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}