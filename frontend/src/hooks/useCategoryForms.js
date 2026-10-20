import { useState } from "react";
import { createCategory, deleteCategory, updateCategory } from "../api";
import { DEFAULT_MONTH, TABS } from "../constants";
import { validateCategoryForm } from "../utils/validation";

// Add / edit / delete category. State lives above the tabs, so it survives tab switches.
export function useCategoryForms({ data, messages, selectedMonth, setActiveTab }) {
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [categoryName, setCategoryName] = useState("");
  const [limitAmount, setLimitAmount] = useState("");

  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryMonth, setEditingCategoryMonth] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryLimit, setEditingCategoryLimit] = useState("");

  const { clearMessages, setCategoryFormMessage, setDeleteMessage, setEditMessage } = messages;

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    clearMessages();

    const validationError = validateCategoryForm(month, categoryName, limitAmount);
    if (validationError) {
      setCategoryFormMessage(validationError);
      return;
    }

    try {
      await createCategory({
        month,
        name: categoryName.trim(),
        limit_amount: Number(limitAmount),
      });

      setCategoryName("");
      setLimitAmount("");
      setCategoryFormMessage("Kategoria została dodana.");
      await data.loadCategories();
      await data.loadOverview(selectedMonth);
    } catch (error) {
      setCategoryFormMessage(error.message || "Nie udało się dodać kategorii.");
    }
  };

  const cancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryMonth("");
    setEditingCategoryName("");
    setEditingCategoryLimit("");
  };

  const handleDeleteCategory = async (categoryId) => {
    clearMessages();
    const confirmed = window.confirm("Na pewno usunąć tę kategorię?");
    if (!confirmed) return;

    try {
      await deleteCategory(categoryId);
      setDeleteMessage("Kategoria została usunięta.");
      if (editingCategoryId === categoryId) cancelCategoryEdit();
      await data.loadCategories();
      await data.loadExpenses();
      await data.loadOverview(selectedMonth);
    } catch (error) {
      setDeleteMessage(error.message || "Nie udało się usunąć kategorii.");
    }
  };

  const startCategoryEdit = (category) => {
    clearMessages();
    setEditingCategoryId(category.id);
    setEditingCategoryMonth(category.month);
    setEditingCategoryName(category.name);
    setEditingCategoryLimit(String(category.limit_amount));
    setActiveTab(TABS.CATEGORIES);
  };

  const handleUpdateCategory = async (event) => {
    event.preventDefault();
    clearMessages();

    const validationError = validateCategoryForm(
      editingCategoryMonth,
      editingCategoryName,
      editingCategoryLimit,
    );
    if (validationError) {
      setEditMessage(validationError);
      return;
    }

    try {
      await updateCategory(editingCategoryId, {
        month: editingCategoryMonth,
        name: editingCategoryName.trim(),
        limit_amount: Number(editingCategoryLimit),
      });

      setEditMessage("Kategoria została zaktualizowana.");
      cancelCategoryEdit();
      await data.loadCategories();
      await data.loadOverview(selectedMonth);
    } catch (error) {
      setEditMessage(error.message || "Nie udało się zaktualizować kategorii.");
    }
  };

  return {
    month,
    setMonth,
    categoryName,
    setCategoryName,
    limitAmount,
    setLimitAmount,
    editingCategoryId,
    editingCategoryMonth,
    setEditingCategoryMonth,
    editingCategoryName,
    setEditingCategoryName,
    editingCategoryLimit,
    setEditingCategoryLimit,
    handleCreateCategory,
    handleDeleteCategory,
    startCategoryEdit,
    cancelCategoryEdit,
    handleUpdateCategory,
  };
}
