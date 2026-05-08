import { ReactNode } from "react";

export interface CategoryBudget {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  color: string;
  icon?: ReactNode;
}

// DEPRECATED: Trip budgets are now stored in the database
// Use the Budget API endpoints (/api/budgets) instead
export const TRIP_BUDGETS: Record<string, { totalBudget: number; tripName: string; dates: string; categories: CategoryBudget[] }> = {};
