import { formatMoney } from "../utils/format";

// Horizontal bars of spending per category, scaled to the largest category.
export default function CategoryChart({ items }) {
  return (
    <div className="chart-wrapper">
      {items.map((item) => (
        <div key={item.category_id} className="chart-row">
          <div className="chart-header">
            <span className="chart-label">{item.category_name}</span>
            <span className={item.is_limit_exceeded ? "chart-value danger-text" : "chart-value"}>
              {formatMoney(item.spent_amount)}
            </span>
          </div>
          <div className="chart-track">
            <div
              className={`chart-bar ${item.is_limit_exceeded ? "danger" : ""}`}
              style={{ width: `${item.widthPercent}%` }}
            />
          </div>
          <div className="chart-meta">
            Limit: {formatMoney(item.category_limit)} · Użycie:{" "}
            {Number(item.usage_percent).toFixed(2)}%
          </div>
        </div>
      ))}
    </div>
  );
}
