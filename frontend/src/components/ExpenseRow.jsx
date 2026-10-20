import { initials } from "../utils/budget";
import { formatDate, formatExpenseAmount } from "../utils/format";

// One expense: 2-letter avatar, name, "category · date", optional note, red amount, optional actions.
export default function ExpenseRow({ expense, actions }) {
  return (
    <div className="expense-row">
      <div className="expense-avatar" aria-hidden="true">{initials(expense.name)}</div>
      <div className="expense-main">
        <div className="expense-name">{expense.name}</div>
        <div className="expense-meta">
          {expense.category_name} · {formatDate(expense.expense_date)}
        </div>
        {expense.notes && <div className="expense-note">{expense.notes}</div>}
      </div>
      <div className="expense-amount negative">{formatExpenseAmount(expense.amount)}</div>
      {actions && <div className="row-actions">{actions}</div>}
    </div>
  );
}
