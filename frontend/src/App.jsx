import { useEffect, useMemo, useState } from "react";
import { getToken, getUser, logout } from "./auth";
import AppLoader from "./components/AppLoader";
import Banner from "./components/Banner";
import BottomNav from "./components/BottomNav";
import PageHeader from "./components/PageHeader";
import Sidebar from "./components/Sidebar";
import { TABS } from "./constants";
import { useBudgetData } from "./hooks/useBudgetData";
import { useBudgetForms } from "./hooks/useBudgetForms";
import { useCategoryForms } from "./hooks/useCategoryForms";
import { useExpenseForms } from "./hooks/useExpenseForms";
import { useMessages } from "./hooks/useMessages";
import BudgetsPage from "./pages/BudgetsPage";
import CategoriesPage from "./pages/CategoriesPage";
import DashboardPage from "./pages/DashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import LoginPage from "./pages/LoginPage";
import { currentMonth } from "./utils/month";

export default function App() {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getUser());
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  // Set by "+ Dodaj wydatek"; the Wydatki page scrolls to and focuses its form, then clears it.
  const [focusAddExpense, setFocusAddExpense] = useState(false);

  // All state lives here (not in the pages), so form input survives switching tabs.
  const data = useBudgetData();
  const messages = useMessages();
  const formDeps = { data, messages, selectedMonth, setActiveTab };
  const categoryForm = useCategoryForms(formDeps);
  const budgetForm = useBudgetForms(formDeps);
  const expenseForm = useExpenseForms(formDeps);

  useEffect(() => {
    if (token) {
      data.loadAllData(selectedMonth);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      data.loadOverview(selectedMonth);
    }
  }, [selectedMonth]);

  const monthExpenses = useMemo(
    () => data.expenses.filter((expense) => String(expense.expense_date).slice(0, 7) === selectedMonth.slice(0, 7)),
    [data.expenses, selectedMonth],
  );

  const handleAuthSuccess = () => {
    setToken(getToken());
    setUser(getUser());
  };

  const handleLogout = () => {
    logout();
    setToken(null);
    setUser(null);
    setActiveTab(TABS.DASHBOARD);
    data.reset();
    messages.clearMessages();
  };

  const navigate = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0 });
  };

  const addExpense = () => {
    setActiveTab(TABS.EXPENSES);
    setFocusAddExpense(true);
  };

  if (!token) {
    return <LoginPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (data.initialLoading) {
    return <AppLoader />;
  }

  const pageMessage = messages.deleteMessage || messages.editMessage;

  return (
    <div className="layout">
      <Sidebar activeTab={activeTab} onNavigate={navigate} user={user} onLogout={handleLogout} />

      <main className="main">
        <PageHeader
          activeTab={activeTab}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          user={user}
          onLogout={handleLogout}
          onSetBudget={() => navigate(TABS.BUDGETS)}
          onAddExpense={addExpense}
        />

        {data.overviewError && <Banner tone="error">{data.overviewError}</Banner>}
        {pageMessage && (
          <Banner tone={pageMessage.toLowerCase().includes("zosta") ? "success" : "error"}>
            {pageMessage}
          </Banner>
        )}

        {activeTab === TABS.DASHBOARD && (
          <DashboardPage
            overview={data.overview}
            loadingOverview={data.loadingOverview}
            monthExpenses={monthExpenses}
            onNavigate={navigate}
          />
        )}

        {activeTab === TABS.EXPENSES && (
          <ExpensesPage
            form={expenseForm}
            data={data}
            selectedMonth={selectedMonth}
            formMessage={messages.expenseFormMessage}
            focusAddForm={focusAddExpense}
            onAddFormFocused={() => setFocusAddExpense(false)}
          />
        )}

        {activeTab === TABS.CATEGORIES && (
          <CategoriesPage
            form={categoryForm}
            data={data}
            selectedMonth={selectedMonth}
            formMessage={messages.categoryFormMessage}
          />
        )}

        {activeTab === TABS.BUDGETS && (
          <BudgetsPage
            form={budgetForm}
            data={data}
            selectedMonth={selectedMonth}
            formMessage={messages.budgetFormMessage}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onNavigate={navigate} onAddExpense={addExpense} />
    </div>
  );
}
