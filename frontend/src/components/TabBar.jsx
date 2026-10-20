import { TABS } from "../constants";

const TAB_ITEMS = [
  [TABS.DASHBOARD, "Dashboard"],
  [TABS.CATEGORIES, "Kategorie"],
  [TABS.BUDGETS, "Budżet"],
  [TABS.EXPENSES, "Wydatki"],
];

export default function TabBar({ activeTab, onChange }) {
  return (
    <nav className="tabbar glass">
      {TAB_ITEMS.map(([tab, label]) => (
        <button
          key={tab}
          className={activeTab === tab ? "tab active" : "tab"}
          onClick={() => onChange(tab)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
