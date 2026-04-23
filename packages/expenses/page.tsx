"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/packages/components/shared/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/packages/components/ui/card";
import { Input } from "@/packages/components/ui/input";
import { Button } from "@/packages/components/ui/button";
import { Label } from "@/packages/components/ui/label";
import { Badge } from "@/packages/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/packages/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/packages/components/ui/dialog";
import { TripFilter, type TripOption } from "@/packages/components/shared/TripFilter";
import { toast } from "sonner";
import { EXPENSE_LABELS, EXPENSE_MESSAGES } from "./constants";

type ApiTrip = {
  _id: string;
  title: string;
  places?: string[];
};

type Member = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isOwner: boolean;
};

type Expense = {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  createdAt: string;
};

type MemberBalance = {
  memberId: string;
  name: string;
  paid: number;
  share: number;
  balance: number;
};

type Settlement = {
  from: string;
  to: string;
  amount: number;
};

const EMPTY_MEMBERS: Member[] = [];
const EMPTY_EXPENSES: Expense[] = [];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase() || "")
    .join("");
}

export default function ExpensesPage() {
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [isTripsLoading, setIsTripsLoading] = useState(true);

  const [tripMembers, setTripMembers] = useState<Record<string, Member[]>>({});
  const [tripExpenses, setTripExpenses] = useState<Record<string, Expense[]>>({});

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadTrips = async () => {
      try {
        const response = await fetch("/api/trips", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          toast.error(data?.message || EXPENSE_MESSAGES.LOAD_TRIPS_FAILED);
          if (isMounted) {
            setTrips([]);
            setSelectedTripId("");
          }
          return;
        }

        const apiTrips = Array.isArray(data?.trips) ? (data.trips as ApiTrip[]) : [];
        const mapped: TripOption[] = apiTrips.map((trip) => ({
          id: String(trip._id),
          destination: trip.places?.[0] || trip.title,
        }));

        if (!isMounted) {
          return;
        }

        setTrips(mapped);
        setSelectedTripId(mapped[0]?.id || "");
      } catch (error) {
        console.error("Load trips failed:", error);
        toast.error(EXPENSE_MESSAGES.LOAD_TRIPS_ERROR);
      } finally {
        if (isMounted) {
          setIsTripsLoading(false);
        }
      }
    };

    loadTrips();

    return () => {
      isMounted = false;
    };
  }, []);

  const members = useMemo(
    () => tripMembers[selectedTripId] || EMPTY_MEMBERS,
    [tripMembers, selectedTripId]
  );
  const expenses = useMemo(
    () => tripExpenses[selectedTripId] || EMPTY_EXPENSES,
    [tripExpenses, selectedTripId]
  );

  const selectedTrip = useMemo(() => trips.find((trip) => trip.id === selectedTripId), [trips, selectedTripId]);

  const totalExpense = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  const perPersonSplit = useMemo(() => {
    if (members.length === 0) {
      return 0;
    }
    return totalExpense / members.length;
  }, [totalExpense, members.length]);

  const memberBalances = useMemo<MemberBalance[]>(() => {
    const paidMap = new Map<string, number>();

    expenses.forEach((expense) => {
      paidMap.set(expense.paidBy, (paidMap.get(expense.paidBy) || 0) + expense.amount);
    });

    return members.map((member) => {
      const paid = paidMap.get(member.id) || 0;
      const share = perPersonSplit;
      return {
        memberId: member.id,
        name: member.name,
        paid,
        share,
        balance: paid - share,
      };
    });
  }, [members, expenses, perPersonSplit]);

  const settlements = useMemo<Settlement[]>(() => {
    const debtors = memberBalances
      .filter((entry) => entry.balance < -0.01)
      .map((entry) => ({ ...entry, remaining: Math.abs(entry.balance) }))
      .sort((a, b) => b.remaining - a.remaining);

    const creditors = memberBalances
      .filter((entry) => entry.balance > 0.01)
      .map((entry) => ({ ...entry, remaining: entry.balance }))
      .sort((a, b) => b.remaining - a.remaining);

    const output: Settlement[] = [];
    let d = 0;
    let c = 0;

    while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];
      const transfer = Math.min(debtor.remaining, creditor.remaining);

      output.push({
        from: debtor.name,
        to: creditor.name,
        amount: transfer,
      });

      debtor.remaining -= transfer;
      creditor.remaining -= transfer;

      if (debtor.remaining <= 0.01) {
        d += 1;
      }
      if (creditor.remaining <= 0.01) {
        c += 1;
      }
    }

    return output;
  }, [memberBalances]);

  const handleAddMember = () => {
    const name = newMemberName.trim();
    const email = newMemberEmail.trim().toLowerCase();

    if (!selectedTripId) {
      toast.error(EXPENSE_MESSAGES.SELECT_TRIP_FIRST);
      return;
    }

    if (!name) {
      toast.error(EXPENSE_MESSAGES.MEMBER_NAME_REQUIRED);
      return;
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error(EXPENSE_MESSAGES.MEMBER_EMAIL_REQUIRED);
      return;
    }

    const exists = members.some((member) => member.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      toast.error(EXPENSE_MESSAGES.MEMBER_ALREADY_EXISTS);
      return;
    }

    const emailExists = members.some((member) => member.email.toLowerCase() === email);
    if (emailExists) {
      toast.error(EXPENSE_MESSAGES.EMAIL_ALREADY_EXISTS);
      return;
    }

    const member: Member = {
      id: crypto.randomUUID(),
      name,
      email,
      avatar: getInitials(name),
      isOwner: members.length === 0,
    };

    setTripMembers((prev) => ({
      ...prev,
      [selectedTripId]: [...(prev[selectedTripId] || []), member],
    }));

    if (!expensePaidBy) {
      setExpensePaidBy(member.id);
    }

    setNewMemberName("");
    setNewMemberEmail("");
    setIsAddMemberOpen(false);
    toast.success(EXPENSE_MESSAGES.MEMBER_ADDED);
  };

  const handleRemoveMember = (memberId: string) => {
    if (!selectedTripId) {
      return;
    }

    const hasExpense = expenses.some((expense) => expense.paidBy === memberId);
    if (hasExpense) {
      toast.error(EXPENSE_MESSAGES.CANNOT_REMOVE_MEMBER);
      return;
    }

    const memberToRemove = members.find((member) => member.id === memberId);
    if (memberToRemove?.isOwner) {
      toast.error(EXPENSE_MESSAGES.CANNOT_REMOVE_OWNER);
      return;
    }

    setTripMembers((prev) => ({
      ...prev,
      [selectedTripId]: (prev[selectedTripId] || []).filter((member) => member.id !== memberId),
    }));

    if (expensePaidBy === memberId) {
      setExpensePaidBy("");
    }
  };

  const handleAddExpense = () => {
    if (!selectedTripId) {
      toast.error(EXPENSE_MESSAGES.SELECT_TRIP_FIRST);
      return;
    }

    const title = expenseTitle.trim();
    const amount = Number(expenseAmount);

    if (!title) {
      toast.error(EXPENSE_MESSAGES.EXPENSE_TITLE_REQUIRED);
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(EXPENSE_MESSAGES.INVALID_AMOUNT);
      return;
    }

    if (!expensePaidBy) {
      toast.error(EXPENSE_MESSAGES.SELECT_WHO_PAID);
      return;
    }

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      title,
      amount,
      paidBy: expensePaidBy,
      createdAt: new Date().toISOString(),
    };

    setTripExpenses((prev) => ({
      ...prev,
      [selectedTripId]: [newExpense, ...(prev[selectedTripId] || [])],
    }));

    setExpenseTitle("");
    setExpenseAmount("");
    toast.success(EXPENSE_MESSAGES.EXPENSE_ADDED);
  };

  if (!isTripsLoading && trips.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{EXPENSE_LABELS.NO_TRIPS_TITLE}</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">{EXPENSE_LABELS.NO_TRIPS_DESC}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{EXPENSE_LABELS.PAGE_TITLE}</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              {selectedTrip ? `${EXPENSE_LABELS.PAGE_DESCRIPTION_SELECTED} ${selectedTrip.destination}` : EXPENSE_LABELS.PAGE_DESCRIPTION_DEFAULT}
            </p>
          </div>
          <div className="w-full md:w-80">
            <TripFilter
              selectedTripId={selectedTripId}
              onTripChange={setSelectedTripId}
              trips={trips}
              isLoading={isTripsLoading}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{EXPENSE_LABELS.GROUP_MANAGEMENT_TITLE}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">{EXPENSE_LABELS.ADD_MEMBER_BUTTON}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{EXPENSE_LABELS.ADD_MEMBER_DIALOG_TITLE}</DialogTitle>
                    <DialogDescription>
                      {EXPENSE_LABELS.ADD_MEMBER_DIALOG_DESC}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="memberName">{EXPENSE_LABELS.MEMBER_NAME_LABEL}</Label>
                      <Input
                        id="memberName"
                        value={newMemberName}
                        onChange={(event) => setNewMemberName(event.target.value)}
                        placeholder={EXPENSE_LABELS.MEMBER_NAME_PLACEHOLDER}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="memberEmail">{EXPENSE_LABELS.MEMBER_EMAIL_LABEL}</Label>
                      <Input
                        id="memberEmail"
                        type="email"
                        value={newMemberEmail}
                        onChange={(event) => setNewMemberEmail(event.target.value)}
                        placeholder={EXPENSE_LABELS.MEMBER_EMAIL_PLACEHOLDER}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                      {EXPENSE_LABELS.CANCEL_BUTTON}
                    </Button>
                    <Button onClick={handleAddMember}>{EXPENSE_LABELS.SAVE_MEMBER_BUTTON}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="space-y-2">
                <Label>{EXPENSE_LABELS.MEMBER_LIST_LABEL}</Label>
                <div className="space-y-2 rounded-lg border bg-zinc-50 p-3 dark:bg-zinc-900">
                  {members.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{EXPENSE_LABELS.NO_MEMBERS_YET}</p>
                  ) : (
                    members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 dark:bg-zinc-950">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                            {member.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{member.name}</p>
                              {member.isOwner && <Badge variant="secondary">{EXPENSE_LABELS.OWNER_BADGE}</Badge>}
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{member.email}</p>
                          </div>
                        </div>
                        {!member.isOwner && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-zinc-500 hover:text-red-600"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            {EXPENSE_LABELS.REMOVE_BUTTON}
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{EXPENSE_LABELS.ADD_EXPENSE_TITLE}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="expenseTitle">{EXPENSE_LABELS.EXPENSE_TITLE_LABEL}</Label>
                <Input
                  id="expenseTitle"
                  value={expenseTitle}
                  onChange={(event) => setExpenseTitle(event.target.value)}
                  placeholder={EXPENSE_LABELS.EXPENSE_TITLE_PLACEHOLDER}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">{EXPENSE_LABELS.AMOUNT_LABEL}</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(event) => setExpenseAmount(event.target.value)}
                  placeholder={EXPENSE_LABELS.AMOUNT_PLACEHOLDER}
                />
              </div>

              <div className="space-y-2">
                <Label>{EXPENSE_LABELS.PAID_BY_LABEL}</Label>
                <Select value={expensePaidBy} onValueChange={setExpensePaidBy}>
                  <SelectTrigger>
                    <SelectValue placeholder={EXPENSE_LABELS.PAID_BY_PLACEHOLDER} />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Button className="w-full sm:w-auto" onClick={handleAddExpense}>
                  {EXPENSE_LABELS.ADD_EXPENSE_BUTTON}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Expense</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{formatCurrency(totalExpense)}</p>
              </div>

              <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Per Person Split</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{formatCurrency(perPersonSplit)}</p>
              </div>

              <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Members</p>
                <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{members.length}</p>
              </div>

              <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Settlements</p>
                <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{settlements.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center text-zinc-500 dark:text-zinc-400">
                  No expenses yet. Add your first expense.
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense) => {
                    const paidByMember = members.find((member) => member.id === expense.paidBy);
                    return (
                      <div
                        key={expense.id}
                        className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-50">{expense.title}</p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Paid by {paidByMember?.name || "Unknown"} on {new Date(expense.createdAt).toLocaleDateString("en-US")}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{formatCurrency(expense.amount)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Member Balances</CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Add members to see balances.</p>
              ) : (
                <div className="space-y-3">
                  {memberBalances.map((entry) => (
                    <div key={entry.memberId} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-50">{entry.name}</p>
                        <p
                          className={
                            entry.balance >= 0
                              ? "font-semibold text-green-600 dark:text-green-400"
                              : "font-semibold text-red-600 dark:text-red-400"
                          }
                        >
                          {entry.balance >= 0 ? "+" : ""}
                          {formatCurrency(entry.balance)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Paid {formatCurrency(entry.paid)} | Fair share {formatCurrency(entry.share)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Who Owes Whom</CardTitle>
            </CardHeader>
            <CardContent>
              {settlements.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {expenses.length === 0 ? "Add expenses to calculate settlements." : "All balances are settled."}
                </p>
              ) : (
                <div className="space-y-3">
                  {settlements.map((item, index) => (
                    <div key={`${item.from}-${item.to}-${index}`} className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        <span className="font-semibold">{item.from}</span> owes <span className="font-semibold">{item.to}</span>
                      </p>
                      <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{formatCurrency(item.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
