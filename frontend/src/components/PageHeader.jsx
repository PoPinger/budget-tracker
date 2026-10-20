import { Plus } from "lucide-react";
import { TABS } from "../constants";
import { formatMonthName, formatMonthTitle } from "../utils/format";
import AccountMenu from "./AccountMenu";
import MonthSwitcher from "./MonthSwitcher";

const OVERLINE = {
  [TABS.DASHBOARD]: "Podsumowanie miesiąca",
  [TABS.EXPENSES]: "Wydatki",
  [TABS.CATEGORIES]: "Kategorie i limity",
  [TABS.BUDGETS]: "Budżet miesiąca",
};

// Desktop: overline + month title, month switcher and actions.
// Mobile: greeting (Pulpit) or section name, month name, month pill and account menu.
export default function PageHeader({ activeTab, selectedMonth, onMonthChange, user, onLogout, onSetBudget, onAddExpense }) {
  const firstName = (user?.full_name || "").trim().split(/\s+/)[0] || user?.email;
  const mobileOverline = activeTab === TABS.DASHBOARD ? `Cześć, ${firstName}` : OVERLINE[activeTab];

  return (
    <>
      <header className="page-header only-desktop">
        <div>
          <div className="overline">{OVERLINE[activeTab]}</div>
          <h1 className="page-title">{formatMonthTitle(selectedMonth)}</h1>
        </div>
        <div className="header-actions">
          <MonthSwitcher value={selectedMonth} onChange={onMonthChange} variant="arrows" />
          <button type="button" className="btn btn-secondary" onClick={onSetBudget}>
            Ustaw budżet
          </button>
          <button type="button" className="btn btn-primary" onClick={onAddExpense}>
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            Dodaj wydatek
          </button>
        </div>
      </header>

      <header className="mobile-header only-mobile">
        <div>
          <div className="overline">{mobileOverline}</div>
          <h1 className="page-title">{formatMonthName(selectedMonth)}</h1>
        </div>
        <div className="mobile-header-actions">
          <MonthSwitcher value={selectedMonth} onChange={onMonthChange} variant="pill" />
          <AccountMenu user={user} onLogout={onLogout} />
        </div>
      </header>
    </>
  );
}
