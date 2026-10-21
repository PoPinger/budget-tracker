import { useEffect, useMemo, useState } from "react";
import { reopenMonth } from "./api";
import { getToken, getUser, logout } from "./auth";
import AppLoader from "./components/AppLoader";
import Banner from "./components/Banner";
import BottomNav from "./components/BottomNav";
import MonthClosedNotice from "./components/MonthClosedNotice";
import MonthEmptyState from "./components/MonthEmptyState";
import PageHeader from "./components/PageHeader";
import Sidebar from "./components/Sidebar";
import { TABS } from "./constants";
import { useBudgetData } from "./hooks/useBudgetData";
import { useBudgetForms } from "./hooks/useBudgetForms";
import { useCategoryForms } from "./hooks/useCategoryForms";
import { useExpenseForms } from "./hooks/useExpenseForms";
import { useMessages } from "./hooks/useMessages";
import { useMonthSetup } from "./hooks/useMonthSetup";
import BudgetsPage from "./pages/BudgetsPage";
import CategoriesPage from "./pages/CategoriesPage";
import DashboardPage from "./pages/DashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import LoginPage from "./pages/LoginPage";
import MonthSetupPage from "./pages/MonthSetupPage";
import { currentMonth } from "./utils/month";

export default function App() {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getUser());
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  // Set by "+ Dodaj wydatek"; the Wydatki page scrolls to and focuses its form, then clears it.
  const [focusAddExpense, setFocusAddExpense] = useState(false);
  const [reopening, setReopening] = useState(false);

  // All state lives here (not in the pages), so form input survives switching tabs.
  const data = useBudgetData();
  const messages = useMessages();
  const formDeps = { data, messages, selectedMonth, setActiveTab };
  const categoryForm = useCategoryForms(formDeps);
  const budgetForm = useBudgetForms(formDeps);
  const expenseForm = useExpenseForms(formDeps);
  const monthSetup = useMonthSetup(formDeps);

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

  const handleReopen = async () => {
    messages.clearMessages();
    setReopening(true);
    try {
      await reopenMonth(selectedMonth);
      await data.loadOverview(selectedMonth);
      messages.setEditMessage("Miesiąc został otwarty ponownie.");
    } catch (error) {
      messages.setEditMessage(error.message || "Nie udało się otworzyć miesiąca.");
    } finally {
      setReopening(false);
    }
  };

  if (!token) {
    return <LoginPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (data.initialLoading) {
    return <AppLoader />;
  }

  const pageMessage = messages.deleteMessage || messages.editMessage;
  // Month state: not_started -> active -> closed. Unknown (load error) behaves like active.
  const monthStatus = data.month?.status;
  const canEdit = !monthStatus || monthStatus === "active";
  // The wizard is part of the Pulpit tab; its input survives switching tabs.
  const showSetup = activeTab === TABS.DASHBOARD && monthSetup.isOpen;
  const showDashboard = activeTab === TABS.DASHBOARD && !monthSetup.isOpen;

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
          canEdit={canEdit}
        />

        {(data.overviewError || data.monthError) && (
          <Banner tone="error">{data.overviewError || data.monthError}</Banner>
        )}
        {pageMessage && (
          <Banner tone={pageMessage.toLowerCase().includes("zosta") ? "success" : "error"}>
            {pageMessage}
          </Banner>
        )}

        {showSetup && <MonthSetupPage setup={monthSetup} selectedMonth={selectedMonth} />}

        {showDashboard && monthStatus === "not_started" && (
          <MonthEmptyState selectedMonth={selectedMonth} onStart={monthSetup.start} />
        )}

        {showDashboard && monthStatus === "closed" && (
          <MonthClosedNotice closedAt={data.month.closed_at} reopening={reopening} onReopen={handleReopen} />
        )}

        {showDashboard && monthStatus !== "not_started" && (
          <DashboardPage
            overview={data.overview}
            loadingOverview={data.loadingOverview}
            monthExpenses={monthExpenses}
            onNavigate={navigate}
            readOnly={!canEdit}
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

      {!showSetup && (
        <BottomNav activeTab={activeTab} onNavigate={navigate} onAddExpense={addExpense} canEdit={canEdit} />
      )}
    </div>
  );
}
