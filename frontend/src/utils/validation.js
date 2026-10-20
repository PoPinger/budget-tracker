import { getSpentForCategory } from "./budget";
import { formatMoney } from "./format";

export function validateCategoryForm(categoryMonth, categoryTitle, categoryLimit) {
  if (!categoryMonth) return "Wybierz miesiąc kategorii.";
  if (!categoryTitle.trim()) return "Nazwa kategorii nie może być pusta.";
  if (categoryTitle.trim().length < 2) return "Nazwa kategorii musi mieć co najmniej 2 znaki.";
  if (!categoryLimit || Number(categoryLimit) <= 0) return "Limit kategorii musi być większy od 0.";
  return "";
}

export function validateBudgetForm(monthValue, amountValue) {
  if (!monthValue) return "Wybierz miesiąc budżetu.";
  if (!amountValue || Number(amountValue) <= 0) return "Kwota budżetu musi być większa od 0.";
  return "";
}

export function validateExpenseForm(
  { categories },
  categoryId,
  name,
  amount,
  date,
) {
  if (!categoryId) return "Wybierz kategorię.";
  if (!name.trim()) return "Nazwa wydatku nie może być pusta.";
  if (name.trim().length < 2) return "Nazwa wydatku musi mieć co najmniej 2 znaki.";
  if (!amount || Number(amount) <= 0) return "Kwota wydatku musi być większa od 0.";
  if (!date) return "Wybierz datę wydatku.";

  const category =
    categories.find((item) => Number(item.id) === Number(categoryId)) || null;
  if (!category) return "Wybrana kategoria nie istnieje.";

  return "";
}

// Over-limit expenses are allowed; this returns the inline warning shown before saving.
export function getLimitWarning(
  { categories, expenses, selectedMonth },
  categoryId,
  amount,
  expenseIdToIgnore = null,
) {
  if (!categoryId || !amount || Number(amount) <= 0) return "";

  const category = categories.find((item) => Number(item.id) === Number(categoryId));
  if (!category) return "";

  const categoryLimit = Number(category.limit_amount || 0);
  const currentSpent = getSpentForCategory(expenses, selectedMonth, categoryId, expenseIdToIgnore);
  const nextSpent = currentSpent + Number(amount);

  if (categoryLimit > 0 && nextSpent > categoryLimit) {
    return `Po zapisaniu przekroczysz limit kategorii „${category.name}” o ${formatMoney(
      nextSpent - categoryLimit,
    )} (limit ${formatMoney(categoryLimit)}).`;
  }

  return "";
}
