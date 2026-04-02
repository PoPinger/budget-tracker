import { fetchApi } from "./client";

export type BudgetResponse = {
  id: number;
  month: string;
  total_limit: number;
  created_at: string;
  updated_at: string;
};

export type BudgetCreatePayload = {
  month: string;
  total_limit: number;
};

export type BudgetUpdatePayload = {
  month?: string;
  total_limit?: number;
};

export async function getBudgets(): Promise<BudgetResponse[]> {
  return fetchApi<BudgetResponse[]>("/budgets");
}

export async function getBudgetByMonth(month: string): Promise<BudgetResponse> {
  return fetchApi<BudgetResponse>(`/budgets/by-month?month=${month}`);
}

export async function createBudget(
  payload: BudgetCreatePayload
): Promise<BudgetResponse> {
  return fetchApi<BudgetResponse>("/budgets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBudget(
  budgetId: number,
  payload: BudgetUpdatePayload
): Promise<BudgetResponse> {
  return fetchApi<BudgetResponse>(`/budgets/${budgetId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteBudget(budgetId: number): Promise<void> {
  await fetchApi<void>(`/budgets/${budgetId}`, {
    method: "DELETE",
  });
}