import { initials } from "../utils/budget";
import { formatDate, formatExpenseAmount } from "../utils/format";

// One expense: 2-letter avatar, name, "category · date", optional note, red amount.
// With onClick the row is a button that opens the "Edytuj wydatek" sheet.
export default function ExpenseRow({ expense, onClick }) {
  const content = (
    <>
      <span className="expense-avatar" aria-hidden="true">{initials(expense.name)}</span>
      <span className="expense-main">
        <span className="expense-name">{expense.name}</span>
        <span className="expense-meta">
          {expense.category_name} · {formatDate(expense.expense_date)}
        </span>
        {expense.notes && <span className="expense-note">{expense.notes}</span>}
      </span>
      <span className="expense-amount negative">{formatExpenseAmount(expense.amount)}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="expense-row expense-row-button" onClick={onClick}>
        {content}
      </button>
    );
  }
  return <div className="expense-row">{content}</div>;
}
