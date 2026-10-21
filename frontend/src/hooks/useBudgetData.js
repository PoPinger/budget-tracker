import { useRef, useState } from "react";
import { getCategories, getExpenses, getIncomes, getMonth, getMonthOverview } from "../api";

// Server data for the dashboard: lists, month overview and state, extra incomes, loading and error states.
export function useBudgetData() {
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [overview, setOverview] = useState(null);
  // Selected month's state: { status: "not_started" | "active" | "closed", salary, ... }.
  const [month, setMonth] = useState(null);
  // Extra incomes of the selected month.
  const [incomes, setIncomes] = useState([]);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState(false);

  const [categoriesError, setCategoriesError] = useState("");
  const [expensesError, setExpensesError] = useState("");
  const [overviewError, setOverviewError] = useState("");
  const [monthError, setMonthError] = useState("");
  // True until the first loadAllData finishes; App shows the full-screen loader meanwhile.
  const [initialLoading, setInitialLoading] = useState(true);
  // Month of the latest loadOverview; responses for any other month are stale (quick month switching) and ignored.
  const requestedMonth = useRef(null);
  const isStale = (monthValue) => requestedMonth.current !== monthValue;

  const loadCategories = async () => {
    setLoadingCategories(true);
    setCategoriesError("");
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      setCategoriesError(error.message || "Nie udało się pobrać kategorii.");
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadExpenses = async () => {
    setLoadingExpenses(true);
    setExpensesError("");
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      setExpensesError(error.message || "Nie udało się pobrać wydatków.");
    } finally {
      setLoadingExpenses(false);
    }
  };

  const fetchOverview = async (monthValue) => {
    setLoadingOverview(true);
    setOverviewError("");
    try {
      const data = await getMonthOverview(monthValue);
      if (isStale(monthValue)) return;
      setOverview(data);
    } catch (error) {
      if (isStale(monthValue)) return;
      setOverview(null);
      setOverviewError(error.message || "Nie udało się pobrać dashboardu.");
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadMonth = async (monthValue) => {
    setLoadingMonth(true);
    setMonthError("");
    try {
      const data = await getMonth(monthValue);
      if (isStale(monthValue)) return;
      setMonth(data);
    } catch (error) {
      if (isStale(monthValue)) return;
      setMonth(null);
      setMonthError(error.message || "Nie udało się pobrać stanu miesiąca.");
    } finally {
      setLoadingMonth(false);
    }
  };

  const loadIncomes = async (monthValue) => {
    try {
      const data = await getIncomes(monthValue);
      if (isStale(monthValue)) return;
      setIncomes(data);
    } catch (error) {
      if (isStale(monthValue)) return;
      setIncomes([]);
      setMonthError(error.message || "Nie udało się pobrać przychodów.");
    }
  };

  // Overview, month state and incomes load together: every change in a month can affect all three.
  const loadOverview = (monthValue) => {
    requestedMonth.current = monthValue;
    return Promise.all([fetchOverview(monthValue), loadMonth(monthValue), loadIncomes(monthValue)]);
  };

  const loadAllData = async (monthValue) => {
    await Promise.all([
      loadCategories(),
      loadExpenses(),
      loadOverview(monthValue),
    ]);
    setInitialLoading(false);
  };

  const reset = () => {
    setCategories([]);
    setExpenses([]);
    setOverview(null);
    setMonth(null);
    setIncomes([]);
    setCategoriesError("");
    setExpensesError("");
    setOverviewError("");
    setMonthError("");
    setInitialLoading(true);
    requestedMonth.current = null;
  };

  return {
    categories,
    expenses,
    overview,
    month,
    incomes,
    loadingCategories,
    loadingExpenses,
    loadingOverview,
    loadingMonth,
    categoriesError,
    expensesError,
    overviewError,
    monthError,
    initialLoading,
    loadCategories,
    loadExpenses,
    loadOverview,
    loadMonth,
    loadAllData,
    reset,
  };
}
