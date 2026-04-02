import { useEffect, useMemo, useState } from "react";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  type CategoryCreatePayload,
} from "../api/categoryCrud";
import type { CategoryResponse } from "../types/category";

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

type CategoryFormState = {
  month: string;
  name: string;
  limit_amount: string;
};

const initialFormState = (): CategoryFormState => ({
  month: getCurrentMonthValue(),
  name: "",
  limit_amount: "",
});

export default function CategoriesPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthValue());
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [form, setForm] = useState<CategoryFormState>(initialFormState);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const filteredCategories = useMemo(() => {
    return categories
      .filter((category) => category.month === selectedMonth)
      .sort((a, b) => a.name.localeCompare(b.name, "pl"));
  }, [categories, selectedMonth]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAllCategories();
        setCategories(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Nie udało się pobrać kategorii.");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadCategories();
  }, []);

  useEffect(() => {
    setForm((previous) => ({
      ...previous,
      month: selectedMonth,
    }));
  }, [selectedMonth]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const refreshCategories = async () => {
    const data = await getAllCategories();
    setCategories(data);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const payload: CategoryCreatePayload = {
        month: form.month,
        name: form.name.trim(),
        limit_amount: Number(form.limit_amount),
      };

      await createCategory(payload);
      await refreshCategories();

      setForm({
        month: selectedMonth,
        name: "",
        limit_amount: "",
      });

      setSuccessMessage("Kategoria została dodana.");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się dodać kategorii.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId: number) => {
    const confirmed = window.confirm("Czy na pewno chcesz usunąć tę kategorię?");
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      await deleteCategory(categoryId);
      await refreshCategories();
      setSuccessMessage("Kategoria została usunięta.");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się usunąć kategorii.");
      }
    }
  };

  return (
    <div className="page">
      <div className="page-header page-header--row">
        <div>
          <h1>Kategorie</h1>
          <p>Dodawanie i usuwanie kategorii wydatków dla wybranego miesiąca.</p>
        </div>

        <div className="month-picker">
          <label htmlFor="categories-month">Miesiąc</label>
          <input
            id="categories-month"
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
            <h3>Dodaj kategorię</h3>
            <p className="muted">Kategoria będzie przypisana do wybranego miesiąca.</p>
          </div>
        </div>

        {error && <div className="alert alert--error">{error}</div>}
        {successMessage && <div className="alert alert--success">{successMessage}</div>}

        <form className="expense-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name">Nazwa kategorii</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="Np. Jedzenie"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="limit_amount">Limit kategorii</label>
              <input
                id="limit_amount"
                name="limit_amount"
                type="number"
                step="0.01"
                min="0.01"
                value={form.limit_amount}
                onChange={handleInputChange}
                placeholder="Np. 500"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Zapisywanie..." : "Dodaj kategorię"}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h3>Lista kategorii</h3>
            <p className="muted">Kategorie przypisane do wybranego miesiąca.</p>
          </div>
        </div>

        {loading ? (
          <p>Ładowanie kategorii...</p>
        ) : filteredCategories.length === 0 ? (
          <div className="empty-state">Brak kategorii dla wybranego miesiąca.</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nazwa</th>
                  <th>Miesiąc</th>
                  <th>Limit</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.month}</td>
                    <td>{formatCurrency(Number(category.limit_amount))}</td>
                    <td>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => void handleDelete(category.id)}
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