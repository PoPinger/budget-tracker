import { fetchApi } from "./client";
import type { CategoryResponse } from "../types/category";

export type CategoryCreatePayload = {
  month: string;
  name: string;
  limit_amount: number;
};

export async function getAllCategories(): Promise<CategoryResponse[]> {
  return fetchApi<CategoryResponse[]>("/categories");
}

export async function createCategory(
  payload: CategoryCreatePayload
): Promise<CategoryResponse> {
  return fetchApi<CategoryResponse>("/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(categoryId: number): Promise<void> {
  await fetchApi<void>(`/categories/${categoryId}`, {
    method: "DELETE",
  });
}