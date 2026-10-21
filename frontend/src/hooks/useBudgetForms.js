import { useState } from "react";
import { createBudget, updateBudget } from "../api";
import { toAmountInput } from "../utils/format";
import { parseAmount, validateSetupBudget } from "../utils/validation";

// "Edytuj budżet" sheet: the selected month's budget (created if the month has none).
export function useBudgetForms({ data, messages, selectedMonth, sheets }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const open = () => {
    messages.clearMessages();
    setAmount(data.overview?.budget_id ? toAmountInput(data.overview.total_budget) : "");
    setError("");
    sheets.open("budget");
  };

  const save = async (event) => {
    event.preventDefault();
    const validationError = validateSetupBudget(amount);
    setError(validationError);
    if (validationError) return;

    const budgetId = data.overview?.budget_id;
    setSaving(true);
    try {
      if (budgetId) {
        await updateBudget(budgetId, { total_limit: parseAmount(amount) });
      } else {
        await createBudget({ month: selectedMonth, total_limit: parseAmount(amount) });
      }
      await data.loadOverview(selectedMonth);
      sheets.close();
      messages.showMessage("Budżet został zaktualizowany.");
    } catch (saveError) {
      setError(saveError.message || "Nie udało się zapisać budżetu.");
    } finally {
      setSaving(false);
    }
  };

  return { amount, setAmount, value: parseAmount(amount), error, saving, open, save };
}
