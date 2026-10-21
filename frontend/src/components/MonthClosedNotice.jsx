import { Lock } from "lucide-react";
import { formatDate } from "../utils/format";

// Closed month banner above the read-only summary, with "Otwórz ponownie".
export default function MonthClosedNotice({ closedAt, reopening, onReopen }) {
  return (
    <div className="month-closed" role="status">
      <div className="month-closed-text">
        <Lock size={18} aria-hidden="true" />
        <span>
          <b>Zamknięty{closedAt && ` ${formatDate(closedAt)}`}</b>
          <span className="month-closed-sub muted">Podsumowanie tylko do odczytu.</span>
        </span>
      </div>
      <button type="button" className="btn btn-primary" onClick={onReopen} disabled={reopening}>
        {reopening ? "Otwieranie..." : "Otwórz ponownie"}
      </button>
    </div>
  );
}
