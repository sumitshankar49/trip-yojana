import { Expense, Member, Settlement } from "@/types/expenses";

export const calculateExpenseShare = (expense: Expense): number => {
  return expense.amount / expense.splitBetween.length;
};

export const calculateSettlements = (
  expenses: Expense[],
  members: Member[]
): Settlement[] => {
  // Calculate net balance for each member
  const balances: { [memberId: string]: number } = {};

  // Initialize balances
  members.forEach((member) => {
    balances[member.id] = 0;
  });

  // Calculate balances
  expenses.forEach((expense) => {
    const sharePerPerson = calculateExpenseShare(expense);

    // Person who paid gets credited
    balances[expense.paidBy] += expense.amount;

    // Everyone who splits the expense gets debited
    expense.splitBetween.forEach((memberId) => {
      balances[memberId] -= sharePerPerson;
    });
  });

  // Create settlements using greedy algorithm
  const settlements: Settlement[] = [];
  const debtors = Object.entries(balances)
    .filter(([, balance]) => balance < -0.01)
    .map(([id, balance]) => ({ id, balance: -balance }))
    .sort((a, b) => b.balance - a.balance);

  const creditors = Object.entries(balances)
    .filter(([, balance]) => balance > 0.01)
    .map(([id, balance]) => ({ id, balance }))
    .sort((a, b) => b.balance - a.balance);

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.balance, creditor.balance);

    if (amount > 0.01) {
      settlements.push({
        from: debtor.id,
        to: creditor.id,
        amount: Number(amount.toFixed(2)),
        isPaid: false,
      });
    }

    debtor.balance -= amount;
    creditor.balance -= amount;

    if (debtor.balance < 0.01) i++;
    if (creditor.balance < 0.01) j++;
  }

  return settlements;
};

export const getTotalExpenses = (expenses: Expense[]): number => {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
};

export const getMemberExpenses = (expenses: Expense[], memberId: string): Expense[] => {
  return expenses.filter(
    (expense) =>
      expense.paidBy === memberId || expense.splitBetween.includes(memberId)
  );
};
