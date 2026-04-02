import { fetchApi } from "./client";
import type { CategoryResponse } from "../types/category";

export async function getCategories(): Promise<CategoryResponse[]> {
  return fetchApi<CategoryResponse[]>("/categories");
}