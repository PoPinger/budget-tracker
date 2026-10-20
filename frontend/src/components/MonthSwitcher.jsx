import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatMonthShort, formatMonthTitle } from "../utils/format";
import { monthRange, shiftMonth } from "../utils/month";

// Month selection. variant "arrows": ‹ paź 2026 › (desktop); "pill": paź 2026 ▾ (mobile).
// Both open a list of months; the value is always the 1st of a month.
export default function MonthSwitcher({ value, onChange, variant = "arrows" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === "keydown" ? event.key === "Escape" : !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const choose = (month) => {
    onChange(month);
    setOpen(false);
  };

  const toggle = (
    <button
      type="button"
      className={variant === "pill" ? "month-pill" : "month-label"}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-label={`Miesiąc: ${formatMonthTitle(value)}`}
      onClick={() => setOpen((isOpen) => !isOpen)}
    >
      {formatMonthShort(value)}
      {variant === "pill" && <ChevronDown size={14} strokeWidth={2.5} aria-hidden="true" />}
    </button>
  );

  return (
    <div className={`month-switcher month-switcher-${variant}`} ref={rootRef}>
      {variant === "arrows" ? (
        <>
          <button type="button" className="month-arrow" aria-label="Poprzedni miesiąc" onClick={() => onChange(shiftMonth(value, -1))}>
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          {toggle}
          <button type="button" className="month-arrow" aria-label="Następny miesiąc" onClick={() => onChange(shiftMonth(value, 1))}>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </>
      ) : (
        toggle
      )}

      {open && (
        <ul className="month-menu" role="listbox" aria-label="Wybierz miesiąc">
          {monthRange(value, 12, 6).map((month) => (
            <li key={month}>
              <button
                type="button"
                role="option"
                aria-selected={month === value}
                className={month === value ? "month-option selected" : "month-option"}
                onClick={() => choose(month)}
              >
                {formatMonthTitle(month)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
