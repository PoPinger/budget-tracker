import { useState } from "react";
import { createCategory, deleteCategory, updateCategory } from "../api";
import { toAmountInput } from "../utils/format";
import { parseAmount, validateSetupCategories } from "../utils/validation";

let nextRowKey = 1;
const emptyRow = () => ({ key: nextRowKey++, id: null, name: "", limit: "", isRecurring: false });

// "Kategorie" sheet: edit all categories of the month at once. Removals and changes are sent on "Zapisz".
export function useCategoryForms({ data, messages, selectedMonth, sheets }) {
  const [rows, setRows] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const monthCategories = () =>
    data.categories.filter((category) => String(category.month).slice(0, 7) === selectedMonth.slice(0, 7));

  const open = () => {
    messages.clearMessages();
    const existing = monthCategories().map((category) => ({
      key: nextRowKey++,
      id: category.id,
      name: category.name,
      limit: toAmountInput(category.limit_amount),
      isRecurring: category.is_recurring,
    }));
    setRows(existing.length ? existing : [emptyRow()]);
    setRemoved([]);
    setError("");
    sheets.open("categories");
  };

  const updateRow = (key, field, value) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  const addRow = () => setRows((current) => [...current, emptyRow()]);

  const removeRow = (row) => {
    if (row.id) {
      const expenseCount = data.expenses.filter((expense) => expense.category_id === row.id && !expense.is_recurring).length;
      const warning = expenseCount
        ? `Usunięcie kategorii „${row.name}” usunie też jej wydatki (${expenseCount}). Kontynuować?`
        : `Usunąć kategorię „${row.name}”?`;
      if (!window.confirm(warning)) return;
      setRemoved((current) => [...current, row.id]);
    }
    setRows((current) => current.filter((item) => item.key !== row.key));
  };

  const reload = () => Promise.all([data.loadCategories(), data.loadExpenses(), data.loadOverview(selectedMonth)]);

  const filledRows = rows.filter((row) => row.name.trim() || String(row.limit).trim());
  const limitsTotal = filledRows.reduce((sum, row) => sum + (parseAmount(row.limit) || 0), 0);

  const save = async (event) => {
    event.preventDefault();
    const validationError = validateSetupCategories(rows);
    setError(validationError);
    if (validationError) return;

    const original = new Map(monthCategories().map((category) => [category.id, category]));
    const payload = (row) => ({
      name: row.name.trim(),
      limit_amount: parseAmount(row.limit),
      is_recurring: row.isRecurring,
    });
    const changed = (row) => {
      const category = original.get(row.id);
      return (
        !category ||
        category.name !== row.name.trim() ||
        Number(category.limit_amount) !== parseAmount(row.limit) ||
        category.is_recurring !== row.isRecurring
      );
    };

    setSaving(true);
    try {
      // Removals first, so a removed name can be reused by a new row.
      for (const categoryId of removed) {
        await deleteCategory(categoryId);
        setRemoved((current) => current.filter((id) => id !== categoryId));
      }
      for (const row of filledRows.filter((item) => item.id && changed(item))) {
        await updateCategory(row.id, payload(row));
      }
      for (const row of filledRows.filter((item) => !item.id)) {
        const created = await createCategory({ month: selectedMonth, ...payload(row) });
        updateRow(row.key, "id", created.id);
      }
      await reload();
      sheets.close();
      messages.showMessage("Kategorie zostały zapisane.");
    } catch (saveError) {
      // Partial saves are possible; show the current server state behind the sheet.
      await reload();
      setError(saveError.message || "Nie udało się zapisać kategorii.");
    } finally {
      setSaving(false);
    }
  };

  return { rows, error, saving, limitsTotal, open, updateRow, addRow, removeRow, save };
}
