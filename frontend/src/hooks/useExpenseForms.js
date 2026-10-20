import { useState } from "react";
import { createExpense, deleteExpense, updateExpense } from "../api";
import { DEFAULT_MONTH, TABS } from "../constants";
import { validateExpenseForm } from "../utils/validation";

// Add / edit / delete expense. State lives above the tabs, so it survives tab switches.
export function useExpenseForms({ data, messages, selectedMonth, setActiveTab }) {
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(DEFAULT_MONTH);
  const [expenseNotes, setExpenseNotes] = useState("");

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingExpenseCategoryId, setEditingExpenseCategoryId] = useState("");
  const [editingExpenseName, setEditingExpenseName] = useState("");
  const [editingExpenseAmount, setEditingExpenseAmount] = useState("");
  const [editingExpenseDate, setEditingExpenseDate] = useState("");
  const [editingExpenseNotes, setEditingExpenseNotes] = useState("");

  const { clearMessages, setExpenseFormMessage, setDeleteMessage, setEditMessage } = messages;
  const validationContext = {
    categories: data.categories,
    expenses: data.expenses,
    selectedMonth,
  };

  const handleCreateExpense = async (event) => {
    event.preventDefault();
    clearMessages();

    const validationError = validateExpenseForm(
      validationContext,
      expenseCategoryId,
      expenseName,
      expenseAmount,
      expenseDate,
    );
    if (validationError) {
      setExpenseFormMessage(validationError);
      return;
    }

    try {
      await createExpense({
        category_id: Number(expenseCategoryId),
        name: expenseName.trim(),
        amount: Number(expenseAmount),
        expense_date: expenseDate,
        notes: expenseNotes.trim() ? expenseNotes.trim() : null,
      });

      setExpenseCategoryId("");
      setExpenseName("");
      setExpenseAmount("");
      setExpenseDate(DEFAULT_MONTH);
      setExpenseNotes("");
      setExpenseFormMessage("Wydatek został dodany.");
      await data.loadExpenses();
      await data.loadOverview(selectedMonth);
    } catch (error) {
      setExpenseFormMessage(error.message || "Nie udało się dodać wydatku.");
    }
  };

  const cancelExpenseEdit = () => {
    setEditingExpenseId(null);
    setEditingExpenseCategoryId("");
    setEditingExpenseName("");
    setEditingExpenseAmount("");
    setEditingExpenseDate("");
    setEditingExpenseNotes("");
  };

  const handleDeleteExpense = async (expenseId) => {
    clearMessages();
    const confirmed = window.confirm("Na pewno usunąć ten wydatek?");
    if (!confirmed) return;

    try {
      await deleteExpense(expenseId);
      setDeleteMessage("Wydatek został usunięty.");
      if (editingExpenseId === expenseId) cancelExpenseEdit();
      await data.loadExpenses();
      await data.loadOverview(selectedMonth);
    } catch (error) {
      setDeleteMessage(error.message || "Nie udało się usunąć wydatku.");
    }
  };

  const startExpenseEdit = (expense) => {
    clearMessages();
    setEditingExpenseId(expense.id);
    setEditingExpenseCategoryId(String(expense.category_id));
    setEditingExpenseName(expense.name);
    setEditingExpenseAmount(String(expense.amount));
    setEditingExpenseDate(expense.expense_date);
    setEditingExpenseNotes(expense.notes || "");
    setActiveTab(TABS.EXPENSES);
  };

  const handleUpdateExpense = async (event) => {
    event.preventDefault();
    clearMessages();

    const validationError = validateExpenseForm(
      validationContext,
      editingExpenseCategoryId,
      editingExpenseName,
      editingExpenseAmount,
      editingExpenseDate,
      editingExpenseId,
    );
    if (validationError) {
      setEditMessage(validationError);
      return;
    }

    try {
      await updateExpense(editingExpenseId, {
        category_id: Number(editingExpenseCategoryId),
        name: editingExpenseName.trim(),
        amount: Number(editingExpenseAmount),
        expense_date: editingExpenseDate,
        notes: editingExpenseNotes.trim() ? editingExpenseNotes.trim() : null,
      });

      setEditMessage("Wydatek został zaktualizowany.");
      cancelExpenseEdit();
      await data.loadExpenses();
      await data.loadOverview(selectedMonth);
    } catch (error) {
      setEditMessage(error.message || "Nie udało się zaktualizować wydatku.");
    }
  };

  return {
    expenseCategoryId,
    setExpenseCategoryId,
    expenseName,
    setExpenseName,
    expenseAmount,
    setExpenseAmount,
    expenseDate,
    setExpenseDate,
    expenseNotes,
    setExpenseNotes,
    editingExpenseId,
    editingExpenseCategoryId,
    setEditingExpenseCategoryId,
    editingExpenseName,
    setEditingExpenseName,
    editingExpenseAmount,
    setEditingExpenseAmount,
    editingExpenseDate,
    setEditingExpenseDate,
    editingExpenseNotes,
    setEditingExpenseNotes,
    handleCreateExpense,
    handleDeleteExpense,
    startExpenseEdit,
    cancelExpenseEdit,
    handleUpdateExpense,
  };
}
