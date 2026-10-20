import { useEffect, useState } from "react";
import { createBudget, deleteBudget, updateBudget } from "../api";
import { TABS } from "../constants";
import { validateBudgetForm } from "../utils/validation";

// Add / edit / delete budget. State lives above the tabs, so it survives tab switches.
export function useBudgetForms({ data, messages, selectedMonth, setActiveTab }) {
  const [budgetMonth, setBudgetMonth] = useState(selectedMonth);

  // New entries default to the month currently shown.
  useEffect(() => {
    setBudgetMonth(selectedMonth);
  }, [selectedMonth]);
  const [budgetAmount, setBudgetAmount] = useState("");

  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [editingBudgetMonth, setEditingBudgetMonth] = useState("");
  const [editingBudgetAmount, setEditingBudgetAmount] = useState("");

  const { clearMessages, setBudgetFormMessage, setDeleteMessage, setEditMessage } = messages;

  const handleCreateBudget = async (event) => {
    event.preventDefault();
    clearMessages();

    const validationError = validateBudgetForm(budgetMonth, budgetAmount);
    if (validationError) {
      setBudgetFormMessage(validationError);
      return;
    }

    try {
      await createBudget({
        month: budgetMonth,
        total_limit: Number(budgetAmount),
      });

      setBudgetAmount("");
      setBudgetFormMessage("Budżet został dodany.");
      await data.loadBudgets();
      await data.loadOverview(selectedMonth);
    } catch (error) {
      setBudgetFormMessage(error.message || "Nie udało się dodać budżetu.");
    }
  };

  const cancelBudgetEdit = () => {
    setEditingBudgetId(null);
    setEditingBudgetMonth("");
    setEditingBudgetAmount("");
  };

  const handleDeleteBudget = async (budgetId) => {
    clearMessages();
    const confirmed = window.confirm("Na pewno usunąć ten budżet?");
    if (!confirmed) return;

    try {
      await deleteBudget(budgetId);
      setDeleteMessage("Budżet został usunięty.");
      if (editingBudgetId === budgetId) cancelBudgetEdit();
      await data.loadBudgets();
      await data.loadOverview(selectedMonth);
    } catch (error) {
      setDeleteMessage(error.message || "Nie udało się usunąć budżetu.");
    }
  };

  const startBudgetEdit = (budget) => {
    clearMessages();
    setEditingBudgetId(budget.id);
    setEditingBudgetMonth(budget.month);
    setEditingBudgetAmount(String(budget.total_limit));
    setActiveTab(TABS.BUDGETS);
  };

  const handleUpdateBudget = async (event) => {
    event.preventDefault();
    clearMessages();

    const validationError = validateBudgetForm(editingBudgetMonth, editingBudgetAmount);
    if (validationError) {
      setEditMessage(validationError);
      return;
    }

    try {
      await updateBudget(editingBudgetId, {
        month: editingBudgetMonth,
        total_limit: Number(editingBudgetAmount),
      });

      setEditMessage("Budżet został zaktualizowany.");
      cancelBudgetEdit();
      await data.loadBudgets();
      await data.loadOverview(selectedMonth);
    } catch (error) {
      setEditMessage(error.message || "Nie udało się zaktualizować budżetu.");
    }
  };

  return {
    budgetMonth,
    setBudgetMonth,
    budgetAmount,
    setBudgetAmount,
    editingBudgetId,
    editingBudgetMonth,
    setEditingBudgetMonth,
    editingBudgetAmount,
    setEditingBudgetAmount,
    handleCreateBudget,
    handleDeleteBudget,
    startBudgetEdit,
    cancelBudgetEdit,
    handleUpdateBudget,
  };
}
