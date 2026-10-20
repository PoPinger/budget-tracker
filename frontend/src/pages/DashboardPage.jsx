import { useMemo } from "react";
import CategoryChart from "../components/CategoryChart";
import Panel, { PanelHeader } from "../components/Panel";
import ProgressBar from "../components/ProgressBar";
import StatCard from "../components/StatCard";
import { formatMoney } from "../utils/format";

export default function DashboardPage({ overview, loadingOverview }) {
  const chartData = useMemo(() => {
    if (!overview?.categories?.length) return [];
    const maxSpent = Math.max(
      ...overview.categories.map((item) => Number(item.spent_amount || 0)),
      1,
    );

    return overview.categories.map((item) => ({
      ...item,
      widthPercent: Math.max((Number(item.spent_amount || 0) / maxSpent) * 100, 4),
    }));
  }, [overview]);

  const loading = "Ładowanie...";
  const usagePercent = Number(overview?.budget_usage_percent || 0);

  return (
    <>
      <section className="stats-grid">
        <StatCard
          label="Budżet miesiąca"
          value={loadingOverview ? loading : formatMoney(overview?.total_budget)}
        />
        <StatCard
          label="Wydano"
          value={loadingOverview ? loading : formatMoney(overview?.total_spent)}
        />
        <StatCard
          label="Pozostało"
          value={loadingOverview ? loading : formatMoney(overview?.remaining_budget)}
          danger={Number(overview?.remaining_budget || 0) < 0}
        />
        <StatCard
          label="Wykorzystanie budżetu"
          value={loadingOverview ? loading : `${usagePercent.toFixed(2)}%`}
          danger={usagePercent > 100}
        >
          <ProgressBar percent={usagePercent} danger={usagePercent > 100} />
        </StatCard>
        <StatCard
          label="Kategorie w miesiącu"
          value={loadingOverview ? loading : overview?.category_count ?? 0}
        />
        <StatCard
          label="Wydatki w miesiącu"
          value={loadingOverview ? loading : overview?.expense_count ?? 0}
        />
      </section>

      <section className="content-grid single">
        <Panel>
          <PanelHeader title="Wydatki per kategoria" />

          {loadingOverview && <p className="muted">Ładowanie wykresu...</p>}

          {!loadingOverview && chartData.length === 0 && (
            <p className="muted">Brak danych wykresu dla wybranego miesiąca.</p>
          )}

          {!loadingOverview && chartData.length > 0 && <CategoryChart items={chartData} />}
        </Panel>

        <Panel>
          <PanelHeader title="Kategorie w dashboardzie" />

          {loadingOverview && <p className="muted">Ładowanie danych dashboardu...</p>}

          {!loadingOverview && overview && overview.categories?.length === 0 && (
            <p className="muted">Brak danych kategorii dla wybranego miesiąca.</p>
          )}

          {!loadingOverview && overview && overview.categories?.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Kategoria</th>
                    <th>Limit</th>
                    <th>Wydano</th>
                    <th>Zostało</th>
                    <th>Użycie</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.categories.map((item) => (
                    <tr key={item.category_id}>
                      <td>{item.category_name}</td>
                      <td>{formatMoney(item.category_limit)}</td>
                      <td>{formatMoney(item.spent_amount)}</td>
                      <td className={item.is_limit_exceeded ? "danger-text semibold" : ""}>
                        {formatMoney(item.remaining_amount)}
                      </td>
                      <td className={item.is_limit_exceeded ? "danger-text semibold" : ""}>
                        {Number(item.usage_percent).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </section>
    </>
  );
}
