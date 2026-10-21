import { useState } from "react";
import { createExpense, deleteExpense, updateExpense } from "../api";
import { toAmountInput } from "../utils/format";
import { defaultExpenseDate } from "../utils/month";
import { getLimitWarning, parseAmount, validateExpenseForm } from "../utils/validation";

// "Dodaj wydatek" / "Edytuj wydatek" sheet. Recurring expenses are not edited here (they follow the category limit).
export function useExpenseForms({ data, messages, selectedMonth, sheets }) {
  const [editingId, setEditingId] = useState(null);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(defaultExpenseDate(selectedMonth));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Spending over a category limit is allowed; the sheet shows this warning before saving.
  const warning = getLimitWarning(
    { categories: data.categories, expenses: data.expenses, selectedMonth },
    categoryId,
    amount,
    editingId,
  );

  const fill = (expense) => {
    setEditingId(expense?.id ?? null);
    setCategoryId(expense ? String(expense.category_id) : "");
    setName(expense?.name ?? "");
    setAmount(expense ? toAmountInput(expense.amount) : "");
    setDate(expense?.expense_date ?? defaultExpenseDate(selectedMonth));
    setNotes(expense?.notes ?? "");
    setError("");
    messages.clearMessages();
    sheets.open("expense");
  };

  const openAdd = () => fill(null);
  const openEdit = (expense) => fill(expense);

  const reload = () => Promise.all([data.loadExpenses(), data.loadOverview(selectedMonth)]);

  const save = async (event) => {
    event.preventDefault();
    const validationError = validateExpenseForm({ categoryId, name, amount, date, month: selectedMonth });
    setError(validationError);
    if (validationError) return;

    const payload = {
      category_id: Number(categoryId),
      name: name.trim(),
      amount: parseAmount(amount),
      expense_date: date,
      notes: notes.trim() ? notes.trim() : null,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }
      await reload();
      sheets.close();
      messages.showMessage(editingId ? "Wydatek został zaktualizowany." : "Wydatek został dodany.");
    } catch (saveError) {
      setError(saveError.message || "Nie udało się zapisać wydatku.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editingId || !window.confirm("Na pewno usunąć ten wydatek?")) return;
    setSaving(true);
    try {
      await deleteExpense(editingId);
      await reload();
      sheets.close();
      messages.showMessage("Wydatek został usunięty.");
    } catch (deleteError) {
      setError(deleteError.message || "Nie udało się usunąć wydatku.");
    } finally {
      setSaving(false);
    }
  };

  return {
    editingId,
    categoryId,
    setCategoryId,
    name,
    setName,
    amount,
    setAmount,
    date,
    setDate,
    notes,
    setNotes,
    error,
    saving,
    warning,
    openAdd,
    openEdit,
    save,
    remove,
  };
}
