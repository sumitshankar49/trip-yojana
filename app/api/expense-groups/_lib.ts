import prisma from "@/backend/config/prisma";

export type GroupBalance = {
  memberId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  paid: number;
  share: number;
  settledIn: number;
  settledOut: number;
  balance: number;
};

export type SettlementSuggestion = {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

export async function hasGroupAccess(userId: string, groupId: string) {
  const group = await prisma.expenseGroup.findFirst({
    where: {
      id: groupId,
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId,
              status: "accepted",
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  return Boolean(group);
}

export async function computeGroupBalances(groupId: string) {
  const [members, expenses, settlements] = await Promise.all([
    prisma.expenseGroupMember.findMany({
      where: { groupId },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    }),
    prisma.expenseGroupExpense.findMany({
      where: { groupId },
      select: {
        id: true,
        amount: true,
        paidByMemberId: true,
        shares: {
          select: {
            memberId: true,
            amount: true,
          },
        },
      },
    }),
    prisma.settlementTransaction.findMany({
      where: {
        groupId,
        status: "completed",
      },
      select: {
        fromMemberId: true,
        toMemberId: true,
        amount: true,
      },
    }),
  ]);

  const activeMemberIds = new Set(
    members
      .filter((member) => member.status !== "removed" && member.status !== "declined")
      .map((member) => member.id)
  );

  const map = new Map<string, GroupBalance>();

  members.forEach((member) => {
    map.set(member.id, {
      memberId: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status,
      paid: 0,
      share: 0,
      settledIn: 0,
      settledOut: 0,
      balance: 0,
    });
  });

  expenses.forEach((expense) => {
    if (activeMemberIds.has(expense.paidByMemberId)) {
      const payer = map.get(expense.paidByMemberId);
      if (payer) payer.paid = round2(payer.paid + expense.amount);
    }

    expense.shares.forEach((share) => {
      if (!activeMemberIds.has(share.memberId)) return;
      const member = map.get(share.memberId);
      if (member) member.share = round2(member.share + share.amount);
    });
  });

  settlements.forEach((settlement) => {
    const from = map.get(settlement.fromMemberId);
    const to = map.get(settlement.toMemberId);
    if (from) from.settledOut = round2(from.settledOut + settlement.amount);
    if (to) to.settledIn = round2(to.settledIn + settlement.amount);
  });

  return Array.from(map.values()).map((entry) => {
    const balance = round2(entry.paid - entry.share - entry.settledOut + entry.settledIn);
    return {
      ...entry,
      balance,
    };
  });
}

export function suggestSettlements(balances: GroupBalance[]): SettlementSuggestion[] {
  const debtors = balances
    .filter((item) => item.status !== "removed" && item.status !== "declined" && item.balance < -0.01)
    .map((item) => ({ ...item, remaining: Math.abs(item.balance) }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = balances
    .filter((item) => item.status !== "removed" && item.status !== "declined" && item.balance > 0.01)
    .map((item) => ({ ...item, remaining: item.balance }))
    .sort((a, b) => b.remaining - a.remaining);

  const suggestions: SettlementSuggestion[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    const amount = round2(Math.min(debtor.remaining, creditor.remaining));
    if (amount > 0.01) {
      suggestions.push({
        fromMemberId: debtor.memberId,
        fromName: debtor.name,
        toMemberId: creditor.memberId,
        toName: creditor.name,
        amount,
      });
    }

    debtor.remaining = round2(debtor.remaining - amount);
    creditor.remaining = round2(creditor.remaining - amount);

    if (debtor.remaining <= 0.01) debtorIndex += 1;
    if (creditor.remaining <= 0.01) creditorIndex += 1;
  }

  return suggestions;
}
