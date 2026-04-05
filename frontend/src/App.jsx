import { useEffect, useMemo, useState } from "react";
import Login from "./Login";
import {
  createBudget,
  createCategory,
  createExpense,
  deleteBudget,
  deleteCategory,
  deleteExpense,
  getBudgets,
  getCategories,
  getExpenses,
  getMonthOverview,
  updateBudget,
  updateCategory,
  updateExpense,
} from "./api";
import { getToken, getUser, logout } from "./auth";

const TABS = {
  DASHBOARD: "dashboard",
  CATEGORIES: "categories",
  BUDGETS: "budgets",
  EXPENSES: "expenses",
};

export default function App() {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getUser());
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [selectedMonth, setSelectedMonth] = useState("2026-04-01");

  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [overview, setOverview] = useState(null);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const [categoriesError, setCategoriesError] = useState("");
  const [budgetsError, setBudgetsError] = useState("");
  const [expensesError, setExpensesError] = useState("");
  const [overviewError, setOverviewError] = useState("");

  const [month, setMonth] = useState("2026-04-01");
  const [categoryName, setCategoryName] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [categoryFormMessage, setCategoryFormMessage] = useState("");

  const [budgetMonth, setBudgetMonth] = useState("2026-04-01");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetFormMessage, setBudgetFormMessage] = useState("");

  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("2026-04-01");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [expenseFormMessage, setExpenseFormMessage] = useState("");

  const [deleteMessage, setDeleteMessage] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryMonth, setEditingCategoryMonth] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryLimit, setEditingCategoryLimit] = useState("");

  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [editingBudgetMonth, setEditingBudgetMonth] = useState("");
  const [editingBudgetAmount, setEditingBudgetAmount] = useState("");

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingExpenseCategoryId, setEditingExpenseCategoryId] = useState("");
  const [editingExpenseName, setEditingExpenseName] = useState("");
  const [editingExpenseAmount, setEditingExpenseAmount] = useState("");
  const [editingExpenseDate, setEditingExpenseDate] = useState("");
  const [editingExpenseNotes, setEditingExpenseNotes] = useState("");

  const formatMoney = (value) => {
    const number = Number(value || 0);
    return `${number.toFixed(2)} zł`;
  };

  const clearMessages = () => {
    setDeleteMessage("");
    setEditMessage("");
    setCategoryFormMessage("");
    setBudgetFormMessage("");
    setExpenseFormMessage("");
  };

  const getCategoryById = (categoryId) => {
    return categories.find((category) => Number(category.id) === Number(categoryId)) || null;
  };

  const getCurrentSpentForCategory = (categoryId, expenseIdToIgnore = null) => {
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
  };

  const validateCategoryForm = (categoryMonth, categoryTitle, categoryLimit) => {
    if (!categoryMonth) return "Wybierz miesiąc kategorii.";
    if (!categoryTitle.trim()) return "Nazwa kategorii nie może być pusta.";
    if (categoryTitle.trim().length < 2) return "Nazwa kategorii musi mieć co najmniej 2 znaki.";
    if (!categoryLimit || Number(categoryLimit) <= 0) return "Limit kategorii musi być większy od 0.";
    return "";
  };

  const validateBudgetForm = (monthValue, amountValue) => {
    if (!monthValue) return "Wybierz miesiąc budżetu.";
    if (!amountValue || Number(amountValue) <= 0) return "Kwota budżetu musi być większa od 0.";
    return "";
  };

  const validateExpenseForm = (
    categoryId,
    name,
    amount,
    date,
    expenseIdToIgnore = null,
  ) => {
    if (!categoryId) return "Wybierz kategorię.";
    if (!name.trim()) return "Nazwa wydatku nie może być pusta.";
    if (name.trim().length < 2) return "Nazwa wydatku musi mieć co najmniej 2 znaki.";
    if (!amount || Number(amount) <= 0) return "Kwota wydatku musi być większa od 0.";
    if (!date) return "Wybierz datę wydatku.";

    const category = getCategoryById(categoryId);
    if (!category) return "Wybrana kategoria nie istnieje.";

    const currentSpent = getCurrentSpentForCategory(categoryId, expenseIdToIgnore);
    const nextSpent = currentSpent + Number(amount);
    const categoryLimit = Number(category.limit_amount || 0);

    if (categoryLimit > 0 && nextSpent > categoryLimit) {
      return `Ten wydatek przekracza limit kategorii "${category.name}". Limit: ${formatMoney(
        categoryLimit,
      )}, po dodaniu będzie: ${formatMoney(nextSpent)}.`;
    }

    return "";
  };

  const loadCategories = async () => {
    setLoadingCategories(true);
    setCategoriesError("");
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      setCategoriesError(error.message || "Nie udało się pobrać kategorii.");
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadBudgets = async () => {
    setLoadingBudgets(true);
    setBudgetsError("");
    try {
      const data = await getBudgets();
      setBudgets(data);
    } catch (error) {
      setBudgetsError(error.message || "Nie udało się pobrać budżetów.");
    } finally {
      setLoadingBudgets(false);
    }
  };

  const loadExpenses = async () => {
    setLoadingExpenses(true);
    setExpensesError("");
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      setExpensesError(error.message || "Nie udało się pobrać wydatków.");
    } finally {
      setLoadingExpenses(false);
    }
  };

  const loadOverview = async (monthValue) => {
    setLoadingOverview(true);
    setOverviewError("");
    try {
      const data = await getMonthOverview(monthValue);
      setOverview(data);
    } catch (error) {
      setOverview(null);
      setOverviewError(error.message || "Nie udało się pobrać dashboardu.");
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadAllData = async (monthValue) => {
    await Promise.all([
      loadCategories(),
      loadBudgets(),
      loadExpenses(),
      loadOverview(monthValue),
    ]);
  };

  useEffect(() => {
    if (token) {
      loadAllData(selectedMonth);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadOverview(selectedMonth);
    }
  }, [selectedMonth]);

  const handleAuthSuccess = () => {
    setToken(getToken());
    setUser(getUser());
  };

  const handleLogout = () => {
    logout();
    setToken(null);
    setUser(null);
    setCategories([]);
    setBudgets([]);
    setExpenses([]);
    setOverview(null);
    setCategoriesError("");
    setBudgetsError("");
    setExpensesError("");
    setOverviewError("");
    setCategoryFormMessage("");
    setBudgetFormMessage("");
    setExpenseFormMessage("");
    setDeleteMessage("");
    setEditMessage("");
  };

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
      await loadCategories();
      await loadOverview(selectedMonth);
    } catch (error) {
      setCategoryFormMessage(error.message || "Nie udało się dodać kategorii.");
    }
  };

  const handleCreateBudget = async (event) => {
    event.preventDefault();
    clearMessages();

    const validationError = validateBudgetForm(budgetMonth, budgetAmount);
    if (validationError) {
      setBudgetFormMessage(validationError);
      return;
    }

    try {
      await createBudget({
        month: budgetMonth,
        total_limit: Number(budgetAmount),
      });

      setBudgetAmount("");
      setBudgetFormMessage("Budżet został dodany.");
      await loadBudgets();
      await loadOverview(selectedMonth);
    } catch (error) {
      setBudgetFormMessage(error.message || "Nie udało się dodać budżetu.");
    }
  };

  const handleCreateExpense = async (event) => {
    event.preventDefault();
    clearMessages();

    const validationError = validateExpenseForm(
      expenseCategoryId,
      expenseName,
      expenseAmount,
      expenseDate,
    );
    if (validationError) {
      setExpenseFormMessage(validationError);
      return;
    }

    try {
      await createExpense({
        category_id: Number(expenseCategoryId),
        name: expenseName.trim(),
        amount: Number(expenseAmount),
        expense_date: expenseDate,
        notes: expenseNotes.trim() ? expenseNotes.trim() : null,
      });

      setExpenseCategoryId("");
      setExpenseName("");
      setExpenseAmount("");
      setExpenseDate("2026-04-01");
      setExpenseNotes("");
      setExpenseFormMessage("Wydatek został dodany.");
      await loadExpenses();
      await loadOverview(selectedMonth);
    } catch (error) {
      setExpenseFormMessage(error.message || "Nie udało się dodać wydatku.");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    clearMessages();
    const confirmed = window.confirm("Na pewno usunąć tę kategorię?");
    if (!confirmed) return;

    try {
      await deleteCategory(categoryId);
      setDeleteMessage("Kategoria została usunięta.");
      if (editingCategoryId === categoryId) cancelCategoryEdit();
      await loadCategories();
      await loadExpenses();
      await loadOverview(selectedMonth);
    } catch (error) {
      setDeleteMessage(error.message || "Nie udało się usunąć kategorii.");
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    clearMessages();
    const confirmed = window.confirm("Na pewno usunąć ten budżet?");
    if (!confirmed) return;

    try {
      await deleteBudget(budgetId);
      setDeleteMessage("Budżet został usunięty.");
      if (editingBudgetId === budgetId) cancelBudgetEdit();
      await loadBudgets();
      await loadOverview(selectedMonth);
    } catch (error) {
      setDeleteMessage(error.message || "Nie udało się usunąć budżetu.");
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    clearMessages();
    const confirmed = window.confirm("Na pewno usunąć ten wydatek?");
    if (!confirmed) return;

    try {
      await deleteExpense(expenseId);
      setDeleteMessage("Wydatek został usunięty.");
      if (editingExpenseId === expenseId) cancelExpenseEdit();
      await loadExpenses();
      await loadOverview(selectedMonth);
    } catch (error) {
      setDeleteMessage(error.message || "Nie udało się usunąć wydatku.");
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

  const cancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryMonth("");
    setEditingCategoryName("");
    setEditingCategoryLimit("");
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
      await loadCategories();
      await loadOverview(selectedMonth);
    } catch (error) {
      setEditMessage(error.message || "Nie udało się zaktualizować kategorii.");
    }
  };

  const startBudgetEdit = (budget) => {
    clearMessages();
    setEditingBudgetId(budget.id);
    setEditingBudgetMonth(budget.month);
    setEditingBudgetAmount(String(budget.total_limit));
    setActiveTab(TABS.BUDGETS);
  };

  const cancelBudgetEdit = () => {
    setEditingBudgetId(null);
    setEditingBudgetMonth("");
    setEditingBudgetAmount("");
  };

  const handleUpdateBudget = async (event) => {
    event.preventDefault();
    clearMessages();

    const validationError = validateBudgetForm(editingBudgetMonth, editingBudgetAmount);
    if (validationError) {
      setEditMessage(validationError);
      return;
    }

    try {
      await updateBudget(editingBudgetId, {
        month: editingBudgetMonth,
        total_limit: Number(editingBudgetAmount),
      });

      setEditMessage("Budżet został zaktualizowany.");
      cancelBudgetEdit();
      await loadBudgets();
      await loadOverview(selectedMonth);
    } catch (error) {
      setEditMessage(error.message || "Nie udało się zaktualizować budżetu.");
    }
  };

  const startExpenseEdit = (expense) => {
    clearMessages();
    setEditingExpenseId(expense.id);
    setEditingExpenseCategoryId(String(expense.category_id));
    setEditingExpenseName(expense.name);
    setEditingExpenseAmount(String(expense.amount));
    setEditingExpenseDate(expense.expense_date);
    setEditingExpenseNotes(expense.notes || "");
    setActiveTab(TABS.EXPENSES);
  };

  const cancelExpenseEdit = () => {
    setEditingExpenseId(null);
    setEditingExpenseCategoryId("");
    setEditingExpenseName("");
    setEditingExpenseAmount("");
    setEditingExpenseDate("");
    setEditingExpenseNotes("");
  };

  const handleUpdateExpense = async (event) => {
    event.preventDefault();
    clearMessages();

    const validationError = validateExpenseForm(
      editingExpenseCategoryId,
      editingExpenseName,
      editingExpenseAmount,
      editingExpenseDate,
      editingExpenseId,
    );
    if (validationError) {
      setEditMessage(validationError);
      return;
    }

    try {
      await updateExpense(editingExpenseId, {
        category_id: Number(editingExpenseCategoryId),
        name: editingExpenseName.trim(),
        amount: Number(editingExpenseAmount),
        expense_date: editingExpenseDate,
        notes: editingExpenseNotes.trim() ? editingExpenseNotes.trim() : null,
      });

      setEditMessage("Wydatek został zaktualizowany.");
      cancelExpenseEdit();
      await loadExpenses();
      await loadOverview(selectedMonth);
    } catch (error) {
      setEditMessage(error.message || "Nie udało się zaktualizować wydatku.");
    }
  };

  const filteredBudgets = useMemo(
    () => budgets.filter((budget) => budget.month === selectedMonth),
    [budgets, selectedMonth],
  );

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseMonth = String(expense.expense_date).slice(0, 7);
      const selectedMonthShort = String(selectedMonth).slice(0, 7);
      return expenseMonth === selectedMonthShort;
    });
  }, [expenses, selectedMonth]);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.month === selectedMonth),
    [categories, selectedMonth],
  );

  const chartData = useMemo(() => {
    if (!overview?.categories?.length) return [];
    const maxSpent = Math.max(
      ...overview.categories.map((item) => Number(item.spent_amount || 0)),
      1,
    );

    return overview.categories.map((item) => ({
      ...item,
      widthPercent: Math.max((Number(item.spent_amount || 0) / maxSpent) * 100, 4),
    }));
  }, [overview]);

  if (!token) {
    return <Login onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="app-shell">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <header className="topbar glass">
        <div>
          <div className="eyebrow">Premium Finance Workspace</div>
          <h1 className="app-title">Budget Tracker</h1>
          <p className="app-subtitle">
            Zalogowany użytkownik: <strong>{user?.full_name || user?.email}</strong>
          </p>
        </div>

        <button className="secondary-btn" onClick={handleLogout}>
          Wyloguj
        </button>
      </header>

      <nav className="tabbar glass">
        <button
          className={activeTab === TABS.DASHBOARD ? "tab active" : "tab"}
          onClick={() => setActiveTab(TABS.DASHBOARD)}
        >
          Dashboard
        </button>
        <button
          className={activeTab === TABS.CATEGORIES ? "tab active" : "tab"}
          onClick={() => setActiveTab(TABS.CATEGORIES)}
        >
          Kategorie
        </button>
        <button
          className={activeTab === TABS.BUDGETS ? "tab active" : "tab"}
          onClick={() => setActiveTab(TABS.BUDGETS)}
        >
          Budżet
        </button>
        <button
          className={activeTab === TABS.EXPENSES ? "tab active" : "tab"}
          onClick={() => setActiveTab(TABS.EXPENSES)}
        >
          Wydatki
        </button>
      </nav>

      <section className="month-row">
        <div className="month-card glass">
          <label className="form-label">
            Miesiąc
            <input
              className="input"
              type="date"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </label>
        </div>
      </section>

      {overviewError && <div className="banner error">{overviewError}</div>}
      {(deleteMessage || editMessage) && (
        <div
          className={`banner ${
            (deleteMessage || editMessage).toLowerCase().includes("zosta") ? "success" : "error"
          }`}
        >
          {deleteMessage || editMessage}
        </div>
      )}

      {activeTab === TABS.DASHBOARD && (
        <>
          <section className="stats-grid">
            <div className="stat-card glass">
              <span className="stat-label">Budżet miesiąca</span>
              <span className="stat-value">
                {loadingOverview ? "Ładowanie..." : formatMoney(overview?.total_budget)}
              </span>
            </div>

            <div className="stat-card glass">
              <span className="stat-label">Wydano</span>
              <span className="stat-value">
                {loadingOverview ? "Ładowanie..." : formatMoney(overview?.total_spent)}
              </span>
            </div>

            <div className="stat-card glass">
              <span className="stat-label">Pozostało</span>
              <span
                className={`stat-value ${
                  Number(overview?.remaining_budget || 0) < 0 ? "danger-text" : ""
                }`}
              >
                {loadingOverview ? "Ładowanie..." : formatMoney(overview?.remaining_budget)}
              </span>
            </div>

            <div className="stat-card glass">
              <span className="stat-label">Wykorzystanie budżetu</span>
              <span
                className={`stat-value ${
                  Number(overview?.budget_usage_percent || 0) > 100 ? "danger-text" : ""
                }`}
              >
                {loadingOverview
                  ? "Ładowanie..."
                  : `${Number(overview?.budget_usage_percent || 0).toFixed(2)}%`}
              </span>
              <div className="progress-track">
                <div
                  className={`progress-fill ${
                    Number(overview?.budget_usage_percent || 0) > 100 ? "danger" : ""
                  }`}
                  style={{
                    width: `${Math.min(Number(overview?.budget_usage_percent || 0), 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="stat-card glass">
              <span className="stat-label">Kategorie w miesiącu</span>
              <span className="stat-value">
                {loadingOverview ? "Ładowanie..." : overview?.category_count ?? 0}
              </span>
            </div>

            <div className="stat-card glass">
              <span className="stat-label">Wydatki w miesiącu</span>
              <span className="stat-value">
                {loadingOverview ? "Ładowanie..." : overview?.expense_count ?? 0}
              </span>
            </div>
          </section>

          <section className="content-grid single">
            <div className="panel glass">
              <div className="panel-header">
                <h2>Wydatki per kategoria</h2>
              </div>

              {loadingOverview && <p className="muted">Ładowanie wykresu...</p>}

              {!loadingOverview && chartData.length === 0 && (
                <p className="muted">Brak danych wykresu dla wybranego miesiąca.</p>
              )}

              {!loadingOverview && chartData.length > 0 && (
                <div className="chart-wrapper">
                  {chartData.map((item) => (
                    <div key={item.category_id} className="chart-row">
                      <div className="chart-header">
                        <span className="chart-label">{item.category_name}</span>
                        <span className={item.is_limit_exceeded ? "chart-value danger-text" : "chart-value"}>
                          {formatMoney(item.spent_amount)}
                        </span>
                      </div>
                      <div className="chart-track">
                        <div
                          className={`chart-bar ${item.is_limit_exceeded ? "danger" : ""}`}
                          style={{ width: `${item.widthPercent}%` }}
                        />
                      </div>
                      <div className="chart-meta">
                        Limit: {formatMoney(item.category_limit)} · Użycie:{" "}
                        {Number(item.usage_percent).toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel glass">
              <div className="panel-header">
                <h2>Kategorie w dashboardzie</h2>
              </div>

              {loadingOverview && <p className="muted">Ładowanie danych dashboardu...</p>}

              {!loadingOverview && overview && overview.categories?.length === 0 && (
                <p className="muted">Brak danych kategorii dla wybranego miesiąca.</p>
              )}

              {!loadingOverview && overview && overview.categories?.length > 0 && (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Kategoria</th>
                        <th>Limit</th>
                        <th>Wydano</th>
                        <th>Zostało</th>
                        <th>Użycie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.categories.map((item) => (
                        <tr key={item.category_id}>
                          <td>{item.category_name}</td>
                          <td>{formatMoney(item.category_limit)}</td>
                          <td>{formatMoney(item.spent_amount)}</td>
                          <td className={item.is_limit_exceeded ? "danger-text semibold" : ""}>
                            {formatMoney(item.remaining_amount)}
                          </td>
                          <td className={item.is_limit_exceeded ? "danger-text semibold" : ""}>
                            {Number(item.usage_percent).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {activeTab === TABS.CATEGORIES && (
        <section className="content-grid">
          <div className="panel glass">
            <h2>{editingCategoryId !== null ? "Zarządzaj kategoriami" : "Dodaj kategorię"}</h2>

            <form onSubmit={handleCreateCategory} className="form-stack">
              <label className="form-label">
                Miesiąc
                <input className="input" type="date" value={month} onChange={(e) => setMonth(e.target.value)} required />
              </label>

              <label className="form-label">
                Nazwa kategorii
                <input
                  className="input"
                  type="text"
                  placeholder="Np. Jedzenie"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                />
              </label>

              <label className="form-label">
                Limit
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Np. 500"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  required
                />
              </label>

              {categoryFormMessage && (
                <div className={categoryFormMessage.toLowerCase().includes("dodana") ? "notice success" : "notice error"}>
                  {categoryFormMessage}
                </div>
              )}

              <button className="primary-btn" type="submit">
                Dodaj kategorię
              </button>
            </form>

            {editingCategoryId !== null && (
              <>
                <div className="divider" />
                <h3>Edytuj kategorię</h3>

                <form onSubmit={handleUpdateCategory} className="form-stack">
                  <label className="form-label">
                    Miesiąc
                    <input
                      className="input"
                      type="date"
                      value={editingCategoryMonth}
                      onChange={(e) => setEditingCategoryMonth(e.target.value)}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Nazwa
                    <input
                      className="input"
                      type="text"
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Limit
                    <input
                      className="input"
                      type="number"
                      min="1"
                      step="0.01"
                      value={editingCategoryLimit}
                      onChange={(e) => setEditingCategoryLimit(e.target.value)}
                      required
                    />
                  </label>

                  <div className="button-row">
                    <button className="primary-btn" type="submit">
                      Zapisz kategorię
                    </button>
                    <button className="secondary-btn" type="button" onClick={cancelCategoryEdit}>
                      Anuluj
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          <div className="panel glass">
            <div className="panel-header">
              <h2>Moje kategorie</h2>
              <button className="primary-btn" onClick={loadCategories}>
                Odśwież
              </button>
            </div>

            {loadingCategories && <p className="muted">Ładowanie kategorii...</p>}
            {categoriesError && <div className="notice error">{categoriesError}</div>}
            {!loadingCategories && !categoriesError && filteredCategories.length === 0 && (
              <p className="muted">Brak kategorii dla wybranego miesiąca.</p>
            )}

            {!loadingCategories && !categoriesError && filteredCategories.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Miesiąc</th>
                      <th>Nazwa</th>
                      <th>Limit</th>
                      <th>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => {
                      const categorySpent = getCurrentSpentForCategory(category.id);
                      const categoryLimit = Number(category.limit_amount || 0);
                      const exceeded = categorySpent > categoryLimit;

                      return (
                        <tr key={category.id}>
                          <td>{category.id}</td>
                          <td>{category.month}</td>
                          <td>{category.name}</td>
                          <td className={exceeded ? "danger-text semibold" : ""}>{category.limit_amount}</td>
                          <td>
                            <div className="actions-inline">
                              <button className="edit-btn" onClick={() => startCategoryEdit(category)}>
                                Edytuj
                              </button>
                              <button className="danger-btn" onClick={() => handleDeleteCategory(category.id)}>
                                Usuń
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === TABS.BUDGETS && (
        <section className="content-grid">
          <div className="panel glass">
            <h2>Dodaj budżet</h2>

            <form onSubmit={handleCreateBudget} className="form-stack">
              <label className="form-label">
                Miesiąc
                <input className="input" type="date" value={budgetMonth} onChange={(e) => setBudgetMonth(e.target.value)} required />
              </label>

              <label className="form-label">
                Kwota budżetu
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Np. 3000"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  required
                />
              </label>

              {budgetFormMessage && (
                <div className={budgetFormMessage.toLowerCase().includes("dodany") ? "notice success" : "notice error"}>
                  {budgetFormMessage}
                </div>
              )}

              <button className="primary-btn" type="submit">
                Dodaj budżet
              </button>
            </form>

            {editingBudgetId !== null && (
              <>
                <div className="divider" />
                <h3>Edytuj budżet</h3>

                <form onSubmit={handleUpdateBudget} className="form-stack">
                  <label className="form-label">
                    Miesiąc
                    <input
                      className="input"
                      type="date"
                      value={editingBudgetMonth}
                      onChange={(e) => setEditingBudgetMonth(e.target.value)}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Kwota
                    <input
                      className="input"
                      type="number"
                      min="1"
                      step="0.01"
                      value={editingBudgetAmount}
                      onChange={(e) => setEditingBudgetAmount(e.target.value)}
                      required
                    />
                  </label>

                  <div className="button-row">
                    <button className="primary-btn" type="submit">
                      Zapisz budżet
                    </button>
                    <button className="secondary-btn" type="button" onClick={cancelBudgetEdit}>
                      Anuluj
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          <div className="panel glass">
            <div className="panel-header">
              <h2>Moje budżety</h2>
              <button className="primary-btn" onClick={loadBudgets}>
                Odśwież
              </button>
            </div>

            {loadingBudgets && <p className="muted">Ładowanie budżetów...</p>}
            {budgetsError && <div className="notice error">{budgetsError}</div>}
            {!loadingBudgets && !budgetsError && filteredBudgets.length === 0 && (
              <p className="muted">Brak budżetów dla wybranego miesiąca.</p>
            )}

            {!loadingBudgets && !budgetsError && filteredBudgets.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Miesiąc</th>
                      <th>Kwota</th>
                      <th>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBudgets.map((budget) => (
                      <tr key={budget.id}>
                        <td>{budget.id}</td>
                        <td>{budget.month}</td>
                        <td>{budget.total_limit}</td>
                        <td>
                          <div className="actions-inline">
                            <button className="edit-btn" onClick={() => startBudgetEdit(budget)}>
                              Edytuj
                            </button>
                            <button className="danger-btn" onClick={() => handleDeleteBudget(budget.id)}>
                              Usuń
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === TABS.EXPENSES && (
        <section className="content-grid">
          <div className="panel glass">
            <h2>Dodaj wydatek</h2>

            <form onSubmit={handleCreateExpense} className="form-stack">
              <label className="form-label">
                Kategoria
                <select
                  className="input"
                  value={expenseCategoryId}
                  onChange={(e) => setExpenseCategoryId(e.target.value)}
                  required
                >
                  <option value="">Wybierz kategorię</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({formatMoney(category.limit_amount)})
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-label">
                Nazwa wydatku
                <input
                  className="input"
                  type="text"
                  placeholder="Np. Zakupy w Biedronce"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  required
                />
              </label>

              <label className="form-label">
                Kwota
                <input
                  className="input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Np. 49.99"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  required
                />
              </label>

              <label className="form-label">
                Data wydatku
                <input
                  className="input"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
              </label>

              <label className="form-label">
                Notatki
                <textarea
                  className="input textarea"
                  placeholder="Opcjonalna notatka"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                />
              </label>

              {expenseFormMessage && (
                <div className={expenseFormMessage.toLowerCase().includes("dodany") ? "notice success" : "notice error"}>
                  {expenseFormMessage}
                </div>
              )}

              <button className="primary-btn" type="submit">
                Dodaj wydatek
              </button>
            </form>

            {editingExpenseId !== null && (
              <>
                <div className="divider" />
                <h3>Edytuj wydatek</h3>

                <form onSubmit={handleUpdateExpense} className="form-stack">
                  <label className="form-label">
                    Kategoria
                    <select
                      className="input"
                      value={editingExpenseCategoryId}
                      onChange={(e) => setEditingExpenseCategoryId(e.target.value)}
                      required
                    >
                      <option value="">Wybierz kategorię</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name} ({formatMoney(category.limit_amount)})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-label">
                    Nazwa
                    <input
                      className="input"
                      type="text"
                      value={editingExpenseName}
                      onChange={(e) => setEditingExpenseName(e.target.value)}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Kwota
                    <input
                      className="input"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={editingExpenseAmount}
                      onChange={(e) => setEditingExpenseAmount(e.target.value)}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Data
                    <input
                      className="input"
                      type="date"
                      value={editingExpenseDate}
                      onChange={(e) => setEditingExpenseDate(e.target.value)}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Notatki
                    <textarea
                      className="input textarea"
                      value={editingExpenseNotes}
                      onChange={(e) => setEditingExpenseNotes(e.target.value)}
                    />
                  </label>

                  <div className="button-row">
                    <button className="primary-btn" type="submit">
                      Zapisz wydatek
                    </button>
                    <button className="secondary-btn" type="button" onClick={cancelExpenseEdit}>
                      Anuluj
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          <div className="panel glass">
            <div className="panel-header">
              <h2>Moje wydatki</h2>
              <button className="primary-btn" onClick={loadExpenses}>
                Odśwież
              </button>
            </div>

            {loadingExpenses && <p className="muted">Ładowanie wydatków...</p>}
            {expensesError && <div className="notice error">{expensesError}</div>}
            {!loadingExpenses && !expensesError && filteredExpenses.length === 0 && (
              <p className="muted">Brak wydatków dla wybranego miesiąca.</p>
            )}

            {!loadingExpenses && !expensesError && filteredExpenses.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Data</th>
                      <th>Nazwa</th>
                      <th>Kategoria</th>
                      <th>Kwota</th>
                      <th>Notatki</th>
                      <th>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>{expense.id}</td>
                        <td>{expense.expense_date}</td>
                        <td>{expense.name}</td>
                        <td>{expense.category_name}</td>
                        <td>{expense.amount}</td>
                        <td>{expense.notes || "-"}</td>
                        <td>
                          <div className="actions-inline">
                            <button className="edit-btn" onClick={() => startExpenseEdit(expense)}>
                              Edytuj
                            </button>
                            <button className="danger-btn" onClick={() => handleDeleteExpense(expense.id)}>
                              Usuń
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}