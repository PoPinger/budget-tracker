import { useEffect, useMemo, useState } from "react";
import { getToken, getUser, logout } from "./auth";
import AddExpenseFab from "./components/AddExpenseFab";
import AppLoader from "./components/AppLoader";
import Banner from "./components/Banner";
import MonthClosedNotice from "./components/MonthClosedNotice";
import MonthEmptyState from "./components/MonthEmptyState";
import PageHeader from "./components/PageHeader";
import Sidebar from "./components/Sidebar";
import { useBudgetData } from "./hooks/useBudgetData";
import { useBudgetForms } from "./hooks/useBudgetForms";
import { useCategoryForms } from "./hooks/useCategoryForms";
import { useExpenseFilters } from "./hooks/useExpenseFilters";
import { useExpenseForms } from "./hooks/useExpenseForms";
import { useIncomeForms } from "./hooks/useIncomeForms";
import { useMessages } from "./hooks/useMessages";
import { useMonthActions } from "./hooks/useMonthActions";
import { useMonthSetup } from "./hooks/useMonthSetup";
import { useSheets } from "./hooks/useSheets";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MonthSetupPage from "./pages/MonthSetupPage";
import MonthSheets from "./pages/MonthSheets";
import { currentMonth } from "./utils/month";

const sameMonth = (value, month) => String(value).slice(0, 7) === month.slice(0, 7);

export default function App() {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getUser());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // All state lives here (not in the pages); pages and sheets only render.
  const data = useBudgetData();
  const messages = useMessages();
  const sheets = useSheets(selectedMonth);
  const formDeps = { data, messages, selectedMonth, sheets };
  const incomeForm = useIncomeForms(formDeps);
  const budgetForm = useBudgetForms(formDeps);
  const categoryForm = useCategoryForms(formDeps);
  const expenseForm = useExpenseForms(formDeps);
  const monthActions = useMonthActions(formDeps);
  const monthSetup = useMonthSetup(formDeps);
  const expenseFilters = useExpenseFilters(selectedMonth);

  useEffect(() => {
    if (token) {
      data.loadAllData(selectedMonth);
    }
  }, [token]);

  useEffect(() => {
    messages.clearMessages();
    if (token) {
      data.loadOverview(selectedMonth);
    }
  }, [selectedMonth]);

  // Newest first; ties (same day) by id, newest first.
  const monthExpenses = useMemo(
    () =>
      data.expenses
        .filter((expense) => sameMonth(expense.expense_date, selectedMonth))
        .sort((a, b) => String(b.expense_date).localeCompare(String(a.expense_date)) || b.id - a.id),
    [data.expenses, selectedMonth],
  );
  const monthCategories = useMemo(
    () => data.categories.filter((category) => sameMonth(category.month, selectedMonth)),
    [data.categories, selectedMonth],
  );

  const handleAuthSuccess = () => {
    setToken(getToken());
    setUser(getUser());
  };

  const handleLogout = () => {
    logout();
    setToken(null);
    setUser(null);
    sheets.close();
    data.reset();
    messages.clearMessages();
  };

  if (!token) {
    return <LoginPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (data.initialLoading) {
    return <AppLoader />;
  }

  // Month state: not_started -> active -> closed. Unknown (load error) behaves like active.
  const monthStatus = data.month?.status;
  const canEdit = !monthStatus || monthStatus === "active";
  const showSetup = monthSetup.isOpen;
  const showDashboard = !showSetup && monthStatus !== "not_started";

  const totals = {
    totalIncome: Number(data.month?.salary || 0) + Number(data.month?.extra_income_total || 0),
    budget: Number(data.overview?.total_budget || 0),
    spent: Number(data.overview?.total_spent || 0),
    limitsTotal: monthCategories.reduce((sum, category) => sum + Number(category.limit_amount || 0), 0),
  };

  return (
    <div className="layout">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main">
        <PageHeader
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          user={user}
          onLogout={handleLogout}
          onCloseMonth={monthActions.confirmClose}
          onAddExpense={expenseForm.openAdd}
          canEdit={canEdit && showDashboard}
        />

        {(data.overviewError || data.monthError) && (
          <Banner tone="error">{data.overviewError || data.monthError}</Banner>
        )}
        {messages.message && <Banner tone={messages.message.tone}>{messages.message.text}</Banner>}

        {showSetup && <MonthSetupPage setup={monthSetup} selectedMonth={selectedMonth} />}

        {!showSetup && monthStatus === "not_started" && (
          <MonthEmptyState selectedMonth={selectedMonth} onStart={monthSetup.start} />
        )}

        {showDashboard && monthStatus === "closed" && (
          <MonthClosedNotice closedAt={data.month.closed_at} reopening={monthActions.busy} onReopen={monthActions.reopen} />
        )}

        {showDashboard && (
          <DashboardPage
            overview={data.overview}
            loadingOverview={data.loadingOverview}
            month={data.month}
            incomes={data.incomes}
            monthCategories={monthCategories}
            monthExpenses={monthExpenses}
            totals={totals}
            filters={expenseFilters}
            readOnly={!canEdit}
            actions={{
              onEditIncomes: incomeForm.openIncomes,
              onEditBudget: budgetForm.open,
              onEditCategories: categoryForm.open,
              onEditExpense: expenseForm.openEdit,
              onCloseMonth: monthActions.confirmClose,
            }}
          />
        )}
      </main>

      {showDashboard && canEdit && !sheets.sheet && <AddExpenseFab onClick={expenseForm.openAdd} />}

      <MonthSheets
        sheets={sheets}
        forms={{
          income: incomeForm,
          budget: budgetForm,
          category: categoryForm,
          expense: expenseForm,
          month: monthActions,
        }}
        data={data}
        totals={totals}
        monthCategories={monthCategories}
        selectedMonth={selectedMonth}
      />
    </div>
  );
}
