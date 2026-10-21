import { useEffect, useState } from "react";

// Which bottom sheet (dialog on desktop) is open: "incomes" | "income" | "budget" | "categories" |
// "expense" | "closeMonth" | null. Only one at a time; switching months closes it.
export function useSheets(selectedMonth) {
  const [sheet, setSheet] = useState(null);

  useEffect(() => {
    setSheet(null);
  }, [selectedMonth]);

  return { sheet, open: setSheet, close: () => setSheet(null) };
}
