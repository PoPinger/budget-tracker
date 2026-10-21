export function getSpentForCategory(expenses, selectedMonth, categoryId, expenseIdToIgnore = null) {
  return expenses
    .filter((expense) => {
      const sameCategory = Number(expense.category_id) === Number(categoryId);
      const sameMonth =
        String(expense.expense_date).slice(0, 7) === String(selectedMonth).slice(0, 7);
      const ignored =
        expenseIdToIgnore !== null && Number(expense.id) === Number(expenseIdToIgnore);
      return sameCategory && sameMonth && !ignored;
    })
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

export const WARNING_THRESHOLD = 80;

// "ok" below 80 % of the limit, "warn" from 80 % up to the limit, "exceeded" above it.
export function limitState(spent, limit) {
  if (Number(limit) <= 0) return "ok";
  const usage = (Number(spent) / Number(limit)) * 100;
  if (Number(spent) > Number(limit)) return "exceeded";
  if (usage >= WARNING_THRESHOLD) return "warn";
  return "ok";
}

// Expense avatar: first two letters of the name ("Koncert" -> "Ko").
export function initials(text) {
  return String(text || "").trim().slice(0, 2) || "?";
}

// User avatar: initials of the first two words ("Demo User" -> "DU").
export function userInitials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] || "?").slice(0, 2).toUpperCase();
}

// Budget bar: lime below 80 %, amber from 80 % up to 100 %, red above 100 %.
export function budgetState(usage) {
  if (usage > 100) return "exceeded";
  if (usage >= WARNING_THRESHOLD) return "warn";
  return "ok";
}

// Savings goal = total income − budget. Percent realized:
// active month: (income − max(spent, budget)) / goal — unspent budget is not counted as saved yet;
// closed month: (income − spent) / goal. Goal <= 0 -> percent is null (no positive goal to reach).
// state: "positive" >= 100 %, "warn" 50–99 %, "exceeded" < 50 % or no positive goal.
export function savingsGoal({ totalIncome, budget, spent, closed }) {
  const goal = Number(totalIncome) - Number(budget);
  const saved = Number(totalIncome) - (closed ? Number(spent) : Math.max(Number(spent), Number(budget)));
  if (goal <= 0) return { goal, saved, percent: null, state: "exceeded" };
  const percent = (saved / goal) * 100;
  const state = percent >= 100 ? "positive" : percent >= 50 ? "warn" : "exceeded";
  return { goal, saved, percent, state };
}
