import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL;

async function apiRequest(path, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "Request failed";

    try {
      const errorData = await response.json();

      if (errorData.detail) {
        errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function login(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(data) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getCategories() {
  return apiRequest("/categories/");
}

export async function createCategory(data) {
  return apiRequest("/categories/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(categoryId, data) {
  return apiRequest(`/categories/${categoryId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(categoryId) {
  return apiRequest(`/categories/${categoryId}`, {
    method: "DELETE",
  });
}

export async function getBudgets() {
  return apiRequest("/budgets/");
}

export async function createBudget(data) {
  return apiRequest("/budgets/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBudget(budgetId, data) {
  return apiRequest(`/budgets/${budgetId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteBudget(budgetId) {
  return apiRequest(`/budgets/${budgetId}`, {
    method: "DELETE",
  });
}

export async function getExpenses() {
  return apiRequest("/expenses/");
}

export async function createExpense(data) {
  return apiRequest("/expenses/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateExpense(expenseId, data) {
  return apiRequest(`/expenses/${expenseId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteExpense(expenseId) {
  return apiRequest(`/expenses/${expenseId}`, {
    method: "DELETE",
  });
}

export async function getMonthOverview(month) {
  return apiRequest(`/stats/month-overview?month=${month}`);
}