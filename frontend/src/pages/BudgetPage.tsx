import { useEffect, useMemo, useState } from "react";
import {
  createBudget,
  deleteBudget,
  getBudgetByMonth,
  getBudgets,
  updateBudget,
  type BudgetResponse,
} from "../api/budgets";

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

type BudgetFormState = {
  total_limit: string;
};

export default function BudgetPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthValue());
  const [budgets, setBudgets] = useState<BudgetResponse[]>([]);
  const [currentBudget, setCurrentBudget] = useState<BudgetResponse | null>(null);
  const [form, setForm] = useState<BudgetFormState>({ total_limit: "" });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const sortedBudgets = useMemo(() => {
    return [...budgets].sort((a, b) => b.month.localeCompare(a.month));
  }, [budgets]);

  const refreshBudgets = async () => {
    const allBudgets = await getBudgets();
    setBudgets(allBudgets);
  };

  const loadBudgetForMonth = async (month: string) => {
    try {
      const budget = await getBudgetByMonth(month);
      setCurrentBudget(budget);
      setForm({ total_limit: String(Number(budget.total_limit)) });
    } catch {
      setCurrentBudget(null);
      setForm({ total_limit: "" });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        await refreshBudgets();
        await loadBudgetForMonth(selectedMonth);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Nie udało się pobrać budżetów.");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setError("");
        setSuccessMessage("");
        await loadBudgetForMonth(selectedMonth);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Nie udało się pobrać budżetu dla miesiąca.");
        }
      }
    };

    void run();
  }, [selectedMonth]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const totalLimit = Number(form.total_limit);

      if (!currentBudget) {
        const created = await createBudget({
          month: selectedMonth,
          total_limit: totalLimit,
        });
        setCurrentBudget(created);
        setSuccessMessage("Budżet został utworzony.");
      } else {
        const updated = await updateBudget(currentBudget.id, {
          total_limit: totalLimit,
        });
        setCurrentBudget(updated);
        setSuccessMessage("Budżet został zaktualizowany.");
      }

      await refreshBudgets();
      await loadBudgetForMonth(selectedMonth);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się zapisać budżetu.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentBudget) {
      return;
    }

    const confirmed = window.confirm("Czy na pewno chcesz usunąć budżet dla tego miesiąca?");
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");

      await deleteBudget(currentBudget.id);
      setCurrentBudget(null);
      setForm({ total_limit: "" });
      setSuccessMessage("Budżet został usunięty.");

      await refreshBudgets();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się usunąć budżetu.");
      }
    }
  };

  return (
    <div className="page">
      <div className="page-header page-header--row">
        <div>
          <h1>Budżet</h1>
          <p>Ustawianie miesięcznego budżetu całkowitego.</p>
        </div>

        <div className="month-picker">
          <label htmlFor="budget-month">Miesiąc</label>
          <input
            id="budget-month"
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
            <h3>Budżet dla wybranego miesiąca</h3>
            <p className="muted">
              {currentBudget
                ? "Ten miesiąc ma już zapisany budżet. Możesz go zmienić."
                : "Dla tego miesiąca nie ma jeszcze budżetu. Możesz go utworzyć."}
            </p>
          </div>
        </div>

        {error && <div className="alert alert--error">{error}</div>}
        {successMessage && <div className="alert alert--success">{successMessage}</div>}

        <form className="expense-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="total_limit">Budżet całkowity</label>
              <input
                id="total_limit"
                name="total_limit"
                type="number"
                step="0.01"
                min="0.01"
                value={form.total_limit}
                onChange={handleInputChange}
                placeholder="Np. 5000"
                required
              />
            </div>
          </div>

          <div className="form-actions budget-actions">
            {currentBudget && (
              <button
                className="danger-button"
                type="button"
                onClick={() => void handleDelete()}
              >
                Usuń budżet
              </button>
            )}

            <button className="primary-button" type="submit" disabled={saving}>
              {saving
                ? "Zapisywanie..."
                : currentBudget
                ? "Zaktualizuj budżet"
                : "Utwórz budżet"}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h3>Zapisane budżety</h3>
            <p className="muted">Lista wszystkich budżetów miesięcznych w systemie.</p>
          </div>
        </div>

        {loading ? (
          <p>Ładowanie budżetów...</p>
        ) : sortedBudgets.length === 0 ? (
          <div className="empty-state">Brak zapisanych budżetów.</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Miesiąc</th>
                  <th>Budżet</th>
                </tr>
              </thead>
              <tbody>
                {sortedBudgets.map((budget) => (
                  <tr key={budget.id}>
                    <td>{budget.month}</td>
                    <td>{formatCurrency(Number(budget.total_limit))}</td>
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