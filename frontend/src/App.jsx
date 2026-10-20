import { useEffect, useState } from "react";
import { getToken, getUser, logout } from "./auth";
import AppHeader from "./components/AppHeader";
import Banner from "./components/Banner";
import MonthPicker from "./components/MonthPicker";
import TabBar from "./components/TabBar";
import { DEFAULT_MONTH, TABS } from "./constants";
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

export default function App() {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getUser());
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [selectedMonth, setSelectedMonth] = useState(DEFAULT_MONTH);

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

  const handleAuthSuccess = () => {
    setToken(getToken());
    setUser(getUser());
  };

  const handleLogout = () => {
    logout();
    setToken(null);
    setUser(null);
    data.reset();
    messages.clearMessages();
  };

  if (!token) {
    return <LoginPage onAuthSuccess={handleAuthSuccess} />;
  }

  const pageMessage = messages.deleteMessage || messages.editMessage;

  return (
    <div className="app-shell">
      <AppHeader user={user} onLogout={handleLogout} />
      <TabBar activeTab={activeTab} onChange={setActiveTab} />
      <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />

      {data.overviewError && <Banner tone="error">{data.overviewError}</Banner>}
      {pageMessage && (
        <Banner tone={pageMessage.toLowerCase().includes("zosta") ? "success" : "error"}>
          {pageMessage}
        </Banner>
      )}

      {activeTab === TABS.DASHBOARD && (
        <DashboardPage overview={data.overview} loadingOverview={data.loadingOverview} />
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

      {activeTab === TABS.EXPENSES && (
        <ExpensesPage
          form={expenseForm}
          data={data}
          selectedMonth={selectedMonth}
          formMessage={messages.expenseFormMessage}
        />
      )}
    </div>
  );
}
