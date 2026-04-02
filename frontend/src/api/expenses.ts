import { fetchApi } from "./client";
import type {
  ExpenseCreate,
  ExpenseWithCategoryResponse,
} from "../types/expense";

export async function getExpenses(
  year?: number,
  month?: number
): Promise<ExpenseWithCategoryResponse[]> {
  if (year && month) {
    return fetchApi<ExpenseWithCategoryResponse[]>(
      `/expenses?year=${year}&month=${month}`
    );
  }

  return fetchApi<ExpenseWithCategoryResponse[]>("/expenses");
}

export async function createExpense(
  payload: ExpenseCreate
): Promise<ExpenseWithCategoryResponse> {
  return fetchApi<ExpenseWithCategoryResponse>("/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteExpense(expenseId: number): Promise<void> {
  await fetchApi<void>(`/expenses/${expenseId}`, {
    method: "DELETE",
  });
}