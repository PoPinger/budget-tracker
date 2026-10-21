import { useEffect, useState } from "react";

// Expense list on the dashboard: search text, category filter ("all" | "recurring" | category id)
// and whether the "Wydatki cykliczne" group is expanded. Reset when the month changes.
export function useExpenseFilters(selectedMonth) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [recurringOpen, setRecurringOpen] = useState(false);

  useEffect(() => {
    setSearch("");
    setFilter("all");
    setRecurringOpen(false);
  }, [selectedMonth]);

  return {
    search,
    setSearch,
    filter,
    setFilter,
    recurringOpen,
    toggleRecurring: () => setRecurringOpen((value) => !value),
  };
}
