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

// Same cap as the backend (Numeric(12, 2)).
const MAX_AMOUNT = 9_999_999_999.99;

// "1 234,56" / "1234.5" -> number; empty or invalid -> NaN. Accepts a comma (inputmode="decimal").
export function parseAmount(value) {
  const text = String(value ?? "").replace(/[\s ]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return Number.NaN;
  return Number(text);
}

// Returns an error message or "" for one amount field. `allowZero` for the salary.
function amountError(value, label, allowZero = false) {
  if (!String(value ?? "").trim()) return `Podaj ${label}.`;
  const amount = parseAmount(value);
  if (Number.isNaN(amount)) return "Podaj poprawną kwotę, np. 4 500 lub 4500,50.";
  if (amount > MAX_AMOUNT) return "Kwota jest za duża.";
  if (!allowZero && amount <= 0) return "Kwota musi być większa od 0.";
  return "";
}

export function validateSetupSalary(salary) {
  return amountError(salary, "wypłatę za ten miesiąc", true);
}

export function validateSetupBudget(budget) {
  return amountError(budget, "kwotę budżetu");
}

// Rows with both fields empty are skipped; names must be unique within the month.
export function validateSetupCategories(rows) {
  const filled = rows.filter((row) => row.name.trim() || String(row.limit).trim());
  const names = new Set();
  for (const row of filled) {
    const name = row.name.trim();
    if (name.length < 2) return "Nazwa kategorii musi mieć co najmniej 2 znaki.";
    const limitError = amountError(row.limit, `limit kategorii „${name}”`);
    if (limitError) return limitError;
    const key = name.toLowerCase();
    if (names.has(key)) return `Kategoria „${name}” występuje więcej niż raz.`;
    names.add(key);
  }
  return "";
}
