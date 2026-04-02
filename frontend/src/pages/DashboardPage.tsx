import { useEffect, useMemo, useState } from "react";
import { fetchApi } from "../api/client";
import type { MonthOverviewResponse } from "../types/stats";
import { formatCurrency, formatPercent, getCurrentMonthValue } from "../utils/format";

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthValue());
  const [overview, setOverview] = useState<MonthOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchApi<MonthOverviewResponse>(
          `/stats/month-overview?month=${selectedMonth}`
        );

        setOverview(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Nie udało się pobrać statystyk miesiąca.");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadOverview();
  }, [selectedMonth]);

  const budgetProgressWidth = useMemo(() => {
    if (!overview) {
      return "0%";
    }

    const value = Math.max(0, Math.min(Number(overview.budget_usage_percent), 100));
    return `${value}%`;
  }, [overview]);

  return (
    <div className="page">
      <div className="page-header page-header--row">
        <div>
          <h1>Dashboard</h1>
          <p>Podsumowanie miesiąca, wykorzystanie budżetu i limity kategorii.</p>
        </div>

        <div className="month-picker">
          <label htmlFor="dashboard-month">Miesiąc</label>
          <input
            id="dashboard-month"
            type="month"
            value={selectedMonth.slice(0, 7)}
            onChange={(event) => {
              setSelectedMonth(`${event.target.value}-01`);
            }}
          />
        </div>
      </div>

      {loading && (
        <section className="hero-card">
          <p>Ładowanie statystyk miesiąca...</p>
        </section>
      )}

      {!loading && error && (
        <section className="hero-card hero-card--error">
          <h2>Błąd pobierania danych</h2>
          <p>{error}</p>
          <p>Upewnij się, że backend działa i że dla wybranego miesiąca masz zapisane dane.</p>
        </section>
      )}

      {!loading && !error && overview && (
        <>
          <section className="stats-grid">
            <article className="metric-card">
              <span className="metric-card__label">Budżet całkowity</span>
              <strong className="metric-card__value">
                {formatCurrency(Number(overview.total_budget))}
              </strong>
            </article>

            <article className="metric-card">
              <span className="metric-card__label">Wydano</span>
              <strong className="metric-card__value">
                {formatCurrency(Number(overview.total_spent))}
              </strong>
            </article>

            <article className="metric-card">
              <span className="metric-card__label">Pozostało</span>
              <strong className="metric-card__value">
                {formatCurrency(Number(overview.remaining_budget))}
              </strong>
            </article>

            <article className="metric-card">
              <span className="metric-card__label">Wykorzystanie budżetu</span>
              <strong className="metric-card__value">
                {formatPercent(Number(overview.budget_usage_percent))}
              </strong>
            </article>
          </section>

          <section className="hero-card">
            <div className="progress-header">
              <div>
                <h2>Wykorzystanie budżetu</h2>
                <p>
                  Wydatki: {formatCurrency(Number(overview.total_spent))} z{" "}
                  {formatCurrency(Number(overview.total_budget))}
                </p>
              </div>
              <strong>{formatPercent(Number(overview.budget_usage_percent))}</strong>
            </div>

            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: budgetProgressWidth }} />
            </div>

            <div className="summary-inline">
              <span>Liczba kategorii: {overview.category_count}</span>
              <span>Liczba wydatków: {overview.expense_count}</span>
              <span>Przekroczone kategorie: {overview.exceeded_categories_count}</span>
            </div>
          </section>

          <section className="card">
            <div className="section-header">
              <div>
                <h3>Kategorie w miesiącu</h3>
                <p className="muted">
                  Limity, wydatki i wykrywanie przekroczeń dla każdej kategorii.
                </p>
              </div>
            </div>

            {overview.categories.length === 0 ? (
              <div className="empty-state">Brak kategorii dla wybranego miesiąca.</div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Kategoria</th>
                      <th>Limit</th>
                      <th>Wydano</th>
                      <th>Pozostało</th>
                      <th>Wykorzystanie</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.categories.map((category) => (
                      <tr key={category.category_id}>
                        <td>{category.category_name}</td>
                        <td>{formatCurrency(Number(category.category_limit))}</td>
                        <td>{formatCurrency(Number(category.spent_amount))}</td>
                        <td>{formatCurrency(Number(category.remaining_amount))}</td>
                        <td>{formatPercent(Number(category.usage_percent))}</td>
                        <td>
                          {category.is_limit_exceeded ? (
                            <span className="badge badge--danger">Przekroczono limit</span>
                          ) : (
                            <span className="badge badge--success">W normie</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}