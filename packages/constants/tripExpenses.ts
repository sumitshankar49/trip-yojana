interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  date: string;
  category: string;
}

// DEPRECATED: Trip members and expenses are now stored in the database
// Use the Expense API endpoints (/api/expenses) instead
export const TRIP_MEMBERS: Record<string, Member[]> = {};

export const TRIP_EXPENSES: Record<string, Expense[]> = {};

