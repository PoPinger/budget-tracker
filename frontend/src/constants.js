export const TABS = {
  DASHBOARD: "dashboard",
  EXPENSES: "expenses",
  CATEGORIES: "categories",
  BUDGETS: "budgets",
};

// Navigation order (sidebar on desktop, bottom bar on mobile).
export const NAV_ITEMS = [
  { tab: TABS.DASHBOARD, label: "Pulpit" },
  { tab: TABS.EXPENSES, label: "Wydatki" },
  { tab: TABS.CATEGORIES, label: "Kategorie" },
  { tab: TABS.BUDGETS, label: "Budżet" },
];
