import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Pydantic's built-in messages are English; these replace them. Our own messages
// (e.g. "Kwota jest za duża.") are already Polish and are shown as they are.
const VALIDATION_MESSAGES = {
  greater_than: "Kwota musi być większa od 0.",
  greater_than_equal: "Kwota nie może być ujemna.",
  string_too_short: "Tekst jest za krótki.",
  string_too_long: "Tekst jest za długi.",
  missing: "Uzupełnij wszystkie wymagane pola.",
  float_parsing: "Podaj poprawną kwotę.",
  float_type: "Podaj poprawną kwotę.",
};
// Types raised with PydanticCustomError in backend/app/schemas (their messages are Polish).
const CUSTOM_ERROR_TYPES = new Set(["amount_too_large"]);
const DEFAULT_VALIDATION_MESSAGE = "Nieprawidłowe dane.";

function validationItemMessage(item) {
  if (CUSTOM_ERROR_TYPES.has(item.type)) return item.msg;
  if (item.type === "value_error") {
    // EmailStr raises an English value_error; our own validators raise Polish ones.
    if (item.loc?.includes("email")) return "Podaj poprawny adres e-mail.";
    return String(item.msg || "").replace(/^Value error, /, "") || DEFAULT_VALIDATION_MESSAGE;
  }
  return VALIDATION_MESSAGES[item.type] || DEFAULT_VALIDATION_MESSAGE;
}

// FastAPI 422: detail is a list of {type, loc, msg}; join the unique Polish messages.
function formatErrorDetail(detail) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = [...new Set(detail.map(validationItemMessage))];
    return messages.join(" ") || DEFAULT_VALIDATION_MESSAGE;
  }
  return DEFAULT_VALIDATION_MESSAGE;
}

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
        errorMessage = formatErrorDetail(errorData.detail);
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

export async function getMonth(month) {
  return apiRequest(`/months/${month}`);
}

export async function getPreviousMonth(month) {
  return apiRequest(`/months/${month}/previous`);
}

export async function setupMonth(data) {
  return apiRequest("/months/setup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function reopenMonth(month) {
  return apiRequest(`/months/${month}/reopen`, {
    method: "POST",
  });
}

export async function closeMonth(month) {
  return apiRequest(`/months/${month}/close`, {
    method: "POST",
  });
}

export async function updateSalary(month, salary) {
  return apiRequest(`/months/${month}/salary`, {
    method: "PUT",
    body: JSON.stringify({ salary }),
  });
}

export async function getIncomes(month) {
  return apiRequest(`/incomes/?month=${month}`);
}

export async function createIncome(data) {
  return apiRequest("/incomes/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateIncome(incomeId, data) {
  return apiRequest(`/incomes/${incomeId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteIncome(incomeId) {
  return apiRequest(`/incomes/${incomeId}`, {
    method: "DELETE",
  });
}
