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
