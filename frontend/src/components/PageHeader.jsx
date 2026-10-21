import { Lock, Plus } from "lucide-react";
import { useSwipe } from "../hooks/useSwipe";
import { formatMonthTitle } from "../utils/format";
import { shiftMonth } from "../utils/month";
import AccountMenu from "./AccountMenu";
import MonthSwitcher from "./MonthSwitcher";

// Desktop: "Mój miesiąc" + month title, month switcher and actions (only in an active month).
// Mobile: greeting + account menu, then "‹ Październik 2026 ›" as the title; swiping the header changes the month
// (actions are at the bottom / floating "+").
export default function PageHeader({ selectedMonth, onMonthChange, user, onLogout, onCloseMonth, onAddExpense, canEdit }) {
  const firstName = (user?.full_name || "").trim().split(/\s+/)[0] || user?.email;
  const swipe = useSwipe({
    onSwipeLeft: () => onMonthChange(shiftMonth(selectedMonth, 1)),
    onSwipeRight: () => onMonthChange(shiftMonth(selectedMonth, -1)),
  });

  return (
    <>
      <header className="page-header only-desktop">
        <div>
          <div className="overline">Mój miesiąc</div>
          <h1 className="page-title">{formatMonthTitle(selectedMonth)}</h1>
        </div>
        <div className="header-actions">
          <MonthSwitcher value={selectedMonth} onChange={onMonthChange} variant="arrows" />
          {canEdit && (
            <>
              <button type="button" className="btn btn-secondary" onClick={onCloseMonth}>
                <Lock size={16} aria-hidden="true" />
                Zamknij miesiąc
              </button>
              <button type="button" className="btn btn-primary" onClick={onAddExpense}>
                <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                Dodaj wydatek
              </button>
            </>
          )}
        </div>
      </header>

      <header className="mobile-header only-mobile" {...swipe}>
        <div className="mobile-header-top">
          <div className="overline">Cześć, {firstName}</div>
          <AccountMenu user={user} onLogout={onLogout} />
        </div>
        <MonthSwitcher value={selectedMonth} onChange={onMonthChange} variant="title" />
      </header>
    </>
  );
}
