import { Plus } from "lucide-react";
import { NAV_ITEMS } from "../constants";
import NavIcon from "./NavIcon";

// Mobile navigation: Pulpit, Wydatki, [+], Kategorie, Budżet. The "+" is hidden outside an active month.
export default function BottomNav({ activeTab, onNavigate, onAddExpense, canEdit }) {
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
      {canEdit ? (
        <button type="button" className="fab" onClick={onAddExpense} aria-label="Dodaj wydatek">
          <Plus size={24} strokeWidth={2.5} aria-hidden="true" />
        </button>
      ) : (
        <span className="fab-placeholder" aria-hidden="true" />
      )}
      {NAV_ITEMS.slice(2).map(item)}
    </nav>
  );
}
