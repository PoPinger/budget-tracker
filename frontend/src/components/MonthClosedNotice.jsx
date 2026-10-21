import { Lock } from "lucide-react";
import { formatDate } from "../utils/format";

// Closed month: the dashboard below is read-only until the month is reopened.
export default function MonthClosedNotice({ closedAt, reopening, onReopen }) {
  return (
    <div className="month-closed" role="status">
      <div className="month-closed-text">
        <Lock size={18} aria-hidden="true" />
        <span>
          <b>Miesiąc zamknięty</b>
          {closedAt && <span className="muted"> · {formatDate(closedAt)}</span>}
          <span className="month-closed-sub muted">Podsumowanie tylko do odczytu.</span>
        </span>
      </div>
      <button type="button" className="btn btn-secondary" onClick={onReopen} disabled={reopening}>
        {reopening ? "Otwieranie..." : "Otwórz ponownie"}
      </button>
    </div>
  );
}
