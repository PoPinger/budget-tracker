import { Plus } from "lucide-react";
import { NAV_ITEMS } from "../constants";
import NavIcon from "./NavIcon";

// Mobile navigation: Pulpit, Wydatki, [+], Kategorie, Budżet.
export default function BottomNav({ activeTab, onNavigate, onAddExpense }) {
  const item = ({ tab, label }) => (
    <button
      key={tab}
      type="button"
      className={activeTab === tab ? "bottom-item active" : "bottom-item"}
      aria-current={activeTab === tab ? "page" : undefined}
      onClick={() => onNavigate(tab)}
    >
      <NavIcon tab={tab} size={20} />
      {label}
    </button>
  );

  return (
    <nav className="bottom-nav" aria-label="Nawigacja">
      {NAV_ITEMS.slice(0, 2).map(item)}
      <button type="button" className="fab" onClick={onAddExpense} aria-label="Dodaj wydatek">
        <Plus size={24} strokeWidth={2.5} aria-hidden="true" />
      </button>
      {NAV_ITEMS.slice(2).map(item)}
    </nav>
  );
}
