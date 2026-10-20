import { formatMoney, formatPercent } from "../utils/format";

// Pill for a category near or over its limit. Never color alone: always an icon + text.
// mode "amount": "● Zostało 36,00 zł" / "▲ Przekroczono o 20,00 zł"; mode "percent": "● 85,6 %" / "▲ 106,7 %".
export default function LimitPill({ state, spent, limit, mode = "amount" }) {
  if (state === "ok") return null;
  const percent = limit > 0 ? (spent / limit) * 100 : 0;

  if (state === "exceeded") {
    return (
      <span className="pill pill-exceeded">
        <span aria-hidden="true">▲</span>
        {mode === "percent" ? formatPercent(percent) : `Przekroczono o ${formatMoney(spent - limit)}`}
      </span>
    );
  }

  return (
    <span className="pill pill-warning">
      <span aria-hidden="true">●</span>
      {mode === "percent" ? formatPercent(percent) : `Zostało ${formatMoney(limit - spent)}`}
    </span>
  );
}
