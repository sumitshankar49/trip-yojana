export interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  date: string;
  category: string;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
  isPaid: boolean;
}

export type SettlementType = 'debt' | 'credit' | 'other';

export interface SettlementMessage {
  message: string;
  type: SettlementType;
}
