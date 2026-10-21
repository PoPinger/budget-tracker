import { useState } from "react";
import { createIncome, deleteIncome, updateIncome, updateSalary } from "../api";
import { toAmountInput } from "../utils/format";
import { defaultExpenseDate } from "../utils/month";
import { parseAmount, validateIncomeForm, validateSetupSalary } from "../utils/validation";

// "Przychody" sheet (salary + extra incomes list) and the "Dodaj / Edytuj przychód" sheet opened from it.
export function useIncomeForms({ data, messages, selectedMonth, sheets }) {
  const [salary, setSalary] = useState("");
  const [salaryError, setSalaryError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = () => data.loadOverview(selectedMonth);

  const openIncomes = () => {
    messages.clearMessages();
    setSalary(toAmountInput(data.month?.salary));
    setSalaryError("");
    sheets.open("incomes");
  };

  const saveSalary = async (event) => {
    event.preventDefault();
    const validationError = validateSetupSalary(salary);
    setSalaryError(validationError);
    if (validationError) return;

    const value = parseAmount(salary);
    if (value === Number(data.month?.salary)) {
      sheets.close();
      return;
    }

    setSaving(true);
    try {
      await updateSalary(selectedMonth, value);
      await reload();
      sheets.close();
      messages.showMessage("Wypłata została zaktualizowana.");
    } catch (saveError) {
      setSalaryError(saveError.message || "Nie udało się zapisać wypłaty.");
    } finally {
      setSaving(false);
    }
  };

  const fillIncome = (income) => {
    setEditingId(income?.id ?? null);
    setName(income?.name ?? "");
    setAmount(income ? toAmountInput(income.amount) : "");
    setDate(income?.income_date ?? defaultExpenseDate(selectedMonth));
    setError("");
    sheets.open("income");
  };

  const openAddIncome = () => fillIncome(null);
  const openEditIncome = (income) => fillIncome(income);
  // The income form always returns to the "Przychody" sheet (salary input is kept).
  const backToIncomes = () => sheets.open("incomes");

  const saveIncome = async (event) => {
    event.preventDefault();
    const validationError = validateIncomeForm({ name, amount, date, month: selectedMonth });
    setError(validationError);
    if (validationError) return;

    const payload = { name: name.trim(), amount: parseAmount(amount), income_date: date };
    setSaving(true);
    try {
      if (editingId) {
        await updateIncome(editingId, payload);
      } else {
        await createIncome(payload);
      }
      await reload();
      backToIncomes();
    } catch (saveError) {
      setError(saveError.message || "Nie udało się zapisać przychodu.");
    } finally {
      setSaving(false);
    }
  };

  const removeIncome = async (income) => {
    if (!window.confirm(`Na pewno usunąć przychód „${income.name}”?`)) return;
    setSalaryError("");
    try {
      await deleteIncome(income.id);
      await reload();
    } catch (deleteError) {
      setSalaryError(deleteError.message || "Nie udało się usunąć przychodu.");
    }
  };

  return {
    salary,
    setSalary,
    salaryError,
    editingId,
    name,
    setName,
    amount,
    setAmount,
    date,
    setDate,
    error,
    saving,
    openIncomes,
    saveSalary,
    openAddIncome,
    openEditIncome,
    backToIncomes,
    saveIncome,
    removeIncome,
  };
}
