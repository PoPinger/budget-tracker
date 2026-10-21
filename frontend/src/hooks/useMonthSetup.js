import { useEffect, useState } from "react";
import { getPreviousMonth, setupMonth } from "../api";
import { toAmountInput as toInput } from "../utils/format";
import {
  parseAmount,
  validateSetupBudget,
  validateSetupCategories,
  validateSetupSalary,
} from "../utils/validation";

export const SETUP_STEPS = ["Wypłata", "Budżet", "Kategorie"];

let nextRowKey = 1;
const emptyRow = () => ({ key: nextRowKey++, name: "", limit: "", isRecurring: false });

const STEP_VALIDATORS = [
  ({ salary }) => validateSetupSalary(salary),
  ({ budget }) => validateSetupBudget(budget),
  ({ rows }) => validateSetupCategories(rows),
];

// Month setup wizard (salary, budget, categories). Lives in App, like all app state.
export function useMonthSetup({ data, messages, selectedMonth }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [salary, setSalary] = useState("");
  const [budget, setBudget] = useState("");
  const [rows, setRows] = useState([emptyRow()]);
  const [previous, setPrevious] = useState(null);
  const [stepError, setStepError] = useState("");
  const [saving, setSaving] = useState(false);

  // The wizard belongs to one month; switching months closes it.
  useEffect(() => {
    setIsOpen(false);
  }, [selectedMonth]);

  const start = async () => {
    messages.clearMessages();
    setStep(0);
    setSalary("");
    setBudget("");
    setRows([emptyRow()]);
    setPrevious(null);
    setStepError("");
    setIsOpen(true);
    try {
      setPrevious(await getPreviousMonth(selectedMonth));
    } catch {
      // Copy options just stay hidden.
    }
  };

  const cancel = () => setIsOpen(false);

  const next = () => {
    const error = STEP_VALIDATORS[step]({ salary, budget, rows });
    setStepError(error);
    if (!error) setStep((value) => value + 1);
  };

  const back = () => {
    setStepError("");
    setStep((value) => Math.max(0, value - 1));
  };

  const updateRow = (key, field, value) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  const addRow = () => setRows((current) => [...current, emptyRow()]);
  const removeRow = (key) =>
    setRows((current) => (current.length > 1 ? current.filter((row) => row.key !== key) : [emptyRow()]));

  const copyPreviousBudget = () => {
    if (previous?.total_limit != null) setBudget(toInput(previous.total_limit));
  };

  const copyPreviousCategories = () => {
    if (!previous?.categories.length) return;
    setRows(
      previous.categories.map((category) => ({
        key: nextRowKey++,
        name: category.name,
        limit: toInput(category.limit_amount),
        isRecurring: category.is_recurring,
      })),
    );
  };

  const filledRows = rows.filter((row) => row.name.trim() || String(row.limit).trim());
  const salaryValue = parseAmount(salary);
  const budgetValue = parseAmount(budget);
  const limitsTotal = filledRows.reduce((sum, row) => sum + (parseAmount(row.limit) || 0), 0);

  const save = async () => {
    const error = STEP_VALIDATORS.map((validate) => validate({ salary, budget, rows })).find(Boolean);
    setStepError(error || "");
    if (error) return;

    setSaving(true);
    try {
      await setupMonth({
        month: selectedMonth,
        salary: salaryValue,
        total_limit: budgetValue,
        categories: filledRows.map((row) => ({
          name: row.name.trim(),
          limit_amount: parseAmount(row.limit),
          is_recurring: row.isRecurring,
        })),
      });
      await Promise.all([data.loadCategories(), data.loadExpenses(), data.loadOverview(selectedMonth)]);
      setIsOpen(false);
      window.scrollTo({ top: 0 });
      messages.showMessage("Miesiąc został rozpoczęty.");
    } catch (saveError) {
      setStepError(saveError.message || "Nie udało się zapisać miesiąca.");
    } finally {
      setSaving(false);
    }
  };

  return {
    isOpen,
    step,
    salary,
    budget,
    rows,
    previous,
    stepError,
    saving,
    salaryValue,
    budgetValue,
    limitsTotal,
    setSalary,
    setBudget,
    updateRow,
    addRow,
    removeRow,
    copyPreviousBudget,
    copyPreviousCategories,
    start,
    cancel,
    next,
    back,
    save,
  };
}
