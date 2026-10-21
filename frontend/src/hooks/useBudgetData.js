import { useState } from "react";
import { getBudgets, getCategories, getExpenses, getMonthOverview } from "../api";

// Server data shared by all tabs: lists, month overview, loading and error states.
export function useBudgetData() {
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [overview, setOverview] = useState(null);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const [categoriesError, setCategoriesError] = useState("");
  const [budgetsError, setBudgetsError] = useState("");
  const [expensesError, setExpensesError] = useState("");
  const [overviewError, setOverviewError] = useState("");
  // True until the first loadAllData finishes; App shows the full-screen loader meanwhile.
  const [initialLoading, setInitialLoading] = useState(true);

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

  const loadBudgets = async () => {
    setLoadingBudgets(true);
    setBudgetsError("");
    try {
      const data = await getBudgets();
      setBudgets(data);
    } catch (error) {
      setBudgetsError(error.message || "Nie udało się pobrać budżetów.");
    } finally {
      setLoadingBudgets(false);
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

  const loadOverview = async (monthValue) => {
    setLoadingOverview(true);
    setOverviewError("");
    try {
      const data = await getMonthOverview(monthValue);
      setOverview(data);
    } catch (error) {
      setOverview(null);
      setOverviewError(error.message || "Nie udało się pobrać dashboardu.");
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadAllData = async (monthValue) => {
    await Promise.all([
      loadCategories(),
      loadBudgets(),
      loadExpenses(),
      loadOverview(monthValue),
    ]);
    setInitialLoading(false);
  };

  const reset = () => {
    setCategories([]);
    setBudgets([]);
    setExpenses([]);
    setOverview(null);
    setCategoriesError("");
    setBudgetsError("");
    setExpensesError("");
    setOverviewError("");
    setInitialLoading(true);
  };

  return {
    categories,
    budgets,
    expenses,
    overview,
    loadingCategories,
    loadingBudgets,
    loadingExpenses,
    loadingOverview,
    categoriesError,
    budgetsError,
    expensesError,
    overviewError,
    initialLoading,
    loadCategories,
    loadBudgets,
    loadExpenses,
    loadOverview,
    loadAllData,
    reset,
  };
}
