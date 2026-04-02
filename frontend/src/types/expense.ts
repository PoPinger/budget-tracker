export type ExpenseCreate = {
  title: string;
  amount: number;
  expense_date: string;
  notes: string | null;
  category_id: number;
};

export type ExpenseWithCategoryResponse = {
  id: number;
  title: string;
  amount: number;
  expense_date: string;
  notes: string | null;
  category_id: number;
  category_name: string;
  created_at: string;
  updated_at: string;
};