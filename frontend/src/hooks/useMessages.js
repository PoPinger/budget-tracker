import { useState } from "react";

// Feedback messages: one per add form, plus the page banner for edits and deletes.
export function useMessages() {
  const [deleteMessage, setDeleteMessage] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [categoryFormMessage, setCategoryFormMessage] = useState("");
  const [budgetFormMessage, setBudgetFormMessage] = useState("");
  const [expenseFormMessage, setExpenseFormMessage] = useState("");

  const clearMessages = () => {
    setDeleteMessage("");
    setEditMessage("");
    setCategoryFormMessage("");
    setBudgetFormMessage("");
    setExpenseFormMessage("");
  };

  return {
    deleteMessage,
    editMessage,
    categoryFormMessage,
    budgetFormMessage,
    expenseFormMessage,
    setDeleteMessage,
    setEditMessage,
    setCategoryFormMessage,
    setBudgetFormMessage,
    setExpenseFormMessage,
    clearMessages,
  };
}
