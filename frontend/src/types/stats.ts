export type CategorySummaryItem = {
  category_id: number;
  category_name: string;
  category_limit: number;
  spent_amount: number;
  remaining_amount: number;
  usage_percent: number;
  is_limit_exceeded: boolean;
};

export type MonthOverviewResponse = {
  month: string;
  budget_id: number | null;
  total_budget: number;
  total_spent: number;
  remaining_budget: number;
  budget_usage_percent: number;
  category_count: number;
  expense_count: number;
  exceeded_categories_count: number;
  categories: CategorySummaryItem[];
};