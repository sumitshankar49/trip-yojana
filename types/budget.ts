export interface CategoryBudget {
  id: string;
  name: string;
  icon: string;
  budgeted: number;
  spent: number;
  color: string;
}

export interface BudgetData {
  totalBudget: number;
  totalSpent: number;
  categories: CategoryBudget[];
}
