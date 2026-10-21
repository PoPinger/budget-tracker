import { CalendarPlus } from "lucide-react";
import { formatMonthTitle } from "../utils/format";
import Panel from "./Panel";

// Not started month: one primary action that opens the setup wizard.
export default function MonthEmptyState({ selectedMonth, onStart }) {
  return (
    <Panel className="month-empty">
      <span className="month-empty-icon" aria-hidden="true">
        <CalendarPlus size={28} />
      </span>
      <h2 className="month-empty-title">{formatMonthTitle(selectedMonth)} nie jest jeszcze rozpoczęty</h2>
      <p className="muted">Ustaw wypłatę, budżet i kategorie, a potem zapisuj wydatki i pilnuj limitów.</p>
      <button type="button" className="btn btn-primary btn-lg" onClick={onStart}>
        Zacznij kontrolę budżetu
      </button>
    </Panel>
  );
}
