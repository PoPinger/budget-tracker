import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthShort, formatMonthTitle } from "../utils/format";
import { currentMonth, shiftMonth } from "../utils/month";

// ‹ month › without limits (any past or future month); tapping the month jumps back to the current one.
// variant "arrows": compact "‹ paź 2026 ›" (desktop header); "title": "‹ Październik 2026 ›" as the page title (mobile).
export default function MonthSwitcher({ value, onChange, variant = "arrows" }) {
  const today = currentMonth();
  const isCurrent = value === today;
  const Label = variant === "title" ? "h1" : "span";

  return (
    <div className={`month-switcher month-switcher-${variant}`}>
      <button type="button" className="month-arrow" aria-label="Poprzedni miesiąc" onClick={() => onChange(shiftMonth(value, -1))}>
        <ChevronLeft size={variant === "title" ? 22 : 16} aria-hidden="true" />
      </button>
      <Label className="month-label-wrap">
        <button
          type="button"
          className="month-label"
          onClick={() => onChange(today)}
          aria-label={
            isCurrent ? `${formatMonthTitle(value)} (bieżący miesiąc)` : `${formatMonthTitle(value)}. Wróć do bieżącego miesiąca`
          }
          title={isCurrent ? undefined : "Wróć do bieżącego miesiąca"}
        >
          {variant === "title" ? formatMonthTitle(value) : formatMonthShort(value)}
          {!isCurrent && <span className="month-today-dot" aria-hidden="true" />}
        </button>
      </Label>
      <button type="button" className="month-arrow" aria-label="Następny miesiąc" onClick={() => onChange(shiftMonth(value, 1))}>
        <ChevronRight size={variant === "title" ? 22 : 16} aria-hidden="true" />
      </button>
    </div>
  );
}
