"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/packages/components/ui/card";
import { Button } from "@/packages/components/ui/button";
import { Input } from "@/packages/components/ui/input";
import { Label } from "@/packages/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/packages/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/packages/components/ui/tabs";
import Navbar from "@/packages/components/shared/Navbar";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/packages/components/ui/dialog";
import { Checkbox } from "@/packages/components/ui/checkbox";
import { Badge } from "@/packages/components/ui/badge";
import { DUMMY_TRIPS } from "../dashboard/constants";
import { TripFilter } from "../components/shared/TripFilter";
import { TRIP_MEMBERS, TRIP_EXPENSES, type Member, type Expense } from "@/packages/constants/tripExpenses";

interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: number;
  isPaid: boolean;
}

export default function ExpensesPage() {
  const [selectedTripId, setSelectedTripId] = useState("1");

  return (
    <ExpensesPageContent key={selectedTripId} selectedTripId={selectedTripId} onTripChange={setSelectedTripId} />
  );
}

function ExpensesPageContent({ selectedTripId, onTripChange }: { selectedTripId: string; onTripChange: (id: string) => void }) {
  const [members, setMembers] = useState<Member[]>(() => TRIP_MEMBERS[selectedTripId] || []);
  const [expenses, setExpenses] = useState<Expense[]>(() => TRIP_EXPENSES[selectedTripId] || []);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [paidSettlements, setPaidSettlements] = useState<Set<string>>(new Set());
  
  const selectedTrip = DUMMY_TRIPS.find(t => t.id === selectedTripId);


  // Current user (first member for demo purposes)
  const currentUserId = members[0]?.id;

  // New member form state
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // New expense form state
  const [newExpenseDescription, setNewExpenseDescription] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpensePaidBy, setNewExpensePaidBy] = useState("");
  const [newExpenseCategory, setNewExpenseCategory] = useState("");
  const [splitMembers, setSplitMembers] = useState<string[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric" 
    });
  };

  const getMemberById = (id: string) => {
    return members.find((m) => m.id === id);
  };

  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      toast.error("Missing Information", {
        description: "Please enter both name and email."
      });
      return;
    }

    const initials = newMemberName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const newMember: Member = {
      id: Date.now().toString(),
      name: newMemberName,
      email: newMemberEmail,
      avatar: initials,
    };

    setMembers([...members, newMember]);
    setNewMemberName("");
    setNewMemberEmail("");
    setIsAddMemberOpen(false);
    
    toast.success("Member Added", {
      description: `${newMemberName} has been added to the group.`
    });
  };

  const handleAddExpense = () => {
    if (
      !newExpenseDescription.trim() ||
      !newExpenseAmount ||
      !newExpensePaidBy ||
      splitMembers.length === 0
    ) {
      toast.error("Incomplete Expense", {
        description: "Please fill all fields and select members to split with."
      });
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      description: newExpenseDescription,
      amount: parseFloat(newExpenseAmount),
      paidBy: newExpensePaidBy,
      splitBetween: splitMembers,
      date: new Date().toISOString().split("T")[0],
      category: newExpenseCategory || "Other",
    };

    setExpenses([newExpense, ...expenses]);
    const payer = getMemberById(newExpensePaidBy);
    
    toast.success("Expense Added", {
      description: `${payer?.name} paid ₹${parseFloat(newExpenseAmount).toFixed(2)} for ${newExpenseDescription}`
    });
    
    setNewExpenseDescription("");
    setNewExpenseAmount("");
    setNewExpensePaidBy("");
    setNewExpenseCategory("");
    setSplitMembers([]);
    setIsAddExpenseOpen(false);
  };

  const toggleSplitMember = (memberId: string) => {
    if (splitMembers.includes(memberId)) {
      setSplitMembers(splitMembers.filter((id) => id !== memberId));
    } else {
      setSplitMembers([...splitMembers, memberId]);
    }
  };

  const calculateSettlements = (): Settlement[] => {
    const balances: Record<string, number> = {};

    // Initialize balances
    members.forEach((member) => {
      balances[member.id] = 0;
    });

    // Calculate balances
    expenses.forEach((expense) => {
      const perPersonAmount = expense.amount / expense.splitBetween.length;

      // Person who paid gets credited
      balances[expense.paidBy] += expense.amount;

      // Everyone who split the expense gets debited
      expense.splitBetween.forEach((memberId) => {
        balances[memberId] -= perPersonAmount;
      });
    });

    // Calculate settlements
    const settlements: Settlement[] = [];
    const debtors = Object.entries(balances)
      .filter(([, balance]) => balance < -0.01)
      .sort((a, b) => a[1] - b[1]);
    const creditors = Object.entries(balances)
      .filter(([, balance]) => balance > 0.01)
      .sort((a, b) => b[1] - a[1]);

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const [debtorId, debtorBalance] = debtors[i];
      const [creditorId, creditorBalance] = creditors[j];

      const amount = Math.min(Math.abs(debtorBalance), creditorBalance);

      const settlementId = `${debtorId}-${creditorId}`;
      settlements.push({
        id: settlementId,
        from: debtorId,
        to: creditorId,
        amount,
        isPaid: paidSettlements.has(settlementId),
      });

      debtors[i] = [debtorId, debtorBalance + amount];
      creditors[j] = [creditorId, creditorBalance - amount];

      if (Math.abs(debtors[i][1]) < 0.01) i++;
      if (Math.abs(creditors[j][1]) < 0.01) j++;
    }

    return settlements;
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const settlements = calculateSettlements();
  const activeSettlements = settlements.filter(s => !s.isPaid);

  const handleMarkPaid = (settlementId: string) => {
    setPaidSettlements(prev => new Set(prev).add(settlementId));
    toast.success("Payment Marked as Settled",  {
      description: "The settlement has been recorded successfully."
    });
  };

  const handleSendReminder = (fromMember: Member, toMember: Member, amount: number) => {
    toast.info(`Reminder Sent to ${fromMember.name}`, {
      description: `Payment reminder for ${formatCurrency(amount)} has been sent.`
    });
  };

  const getSettlementMessage = (settlement: Settlement, currentUserId: string) => {
    const fromMember = getMemberById(settlement.from);
    const toMember = getMemberById(settlement.to);
    
    if (settlement.from === currentUserId) {
      return {
        message: `You owe ${toMember?.name}`,
        type: 'debt' as const,
      };
    } else if (settlement.to === currentUserId) {
      return {
        message: `${fromMember?.name} owes you`,
        type: 'credit' as const,
      };
    } else {
      return {
        message: `${fromMember?.name} owes ${toMember?.name}`,
        type: 'other' as const,
      };
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Group Expenses
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              {selectedTrip?.destination} - Split expenses with your group
            </p>
          </div>
          <div className="w-64">
            <TripFilter
              selectedTripId={selectedTripId}
              onTripChange={onTripChange}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatCurrency(totalExpenses)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Group Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {members.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Pending Settlements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {activeSettlements.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Group Members
              </h2>
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 mr-2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Member</DialogTitle>
                    <DialogDescription>
                      Add a new person to split expenses with.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="member-name">Name</Label>
                      <Input
                        id="member-name"
                        placeholder="Enter member name"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="member-email">Email</Label>
                      <Input
                        id="member-email"
                        type="email"
                        placeholder="Enter member email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMember}>Add Member</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {member.avatar}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {member.name}
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                All Expenses
              </h2>
              <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 mr-2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                    <DialogDescription>
                      Record a new expense and split it among group members.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="expense-description">Description</Label>
                      <Input
                        id="expense-description"
                        placeholder="What was this expense for?"
                        value={newExpenseDescription}
                        onChange={(e) => setNewExpenseDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-amount">Amount</Label>
                      <Input
                        id="expense-amount"
                        type="number"
                        placeholder="0.00"
                        value={newExpenseAmount}
                        onChange={(e) => setNewExpenseAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-category">Category</Label>
                      <Select value={newExpenseCategory} onValueChange={setNewExpenseCategory}>
                        <SelectTrigger id="expense-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Food">Food</SelectItem>
                          <SelectItem value="Transport">Transport</SelectItem>
                          <SelectItem value="Accommodation">Accommodation</SelectItem>
                          <SelectItem value="Activities">Activities</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-paid-by">Paid By</Label>
                      <Select value={newExpensePaidBy} onValueChange={setNewExpensePaidBy}>
                        <SelectTrigger id="expense-paid-by">
                          <SelectValue placeholder="Who paid?" />
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
                    <div className="space-y-2">
                      <Label>Split Between</Label>
                      <div className="space-y-3 border rounded-lg p-4">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`split-${member.id}`}
                              checked={splitMembers.includes(member.id)}
                              onCheckedChange={() => toggleSplitMember(member.id)}
                            />
                            <label
                              htmlFor={`split-${member.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {member.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      {splitMembers.length > 0 && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {formatCurrency(
                            parseFloat(newExpenseAmount || "0") / splitMembers.length
                          )}{" "}
                          per person
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddExpense}>Add Expense</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {expenses.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <p className="text-zinc-600 dark:text-zinc-400">No expenses yet</p>
                  </CardContent>
                </Card>
              ) : (
                expenses.map((expense) => {
                  const paidByMember = getMemberById(expense.paidBy);
                  const perPersonAmount = expense.amount / expense.splitBetween.length;

                  return (
                    <Card key={expense.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4 flex-1">
                            <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-5 h-5 text-primary"
                              >
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                    {expense.description}
                                  </h3>
                                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                    Paid by <span className="font-medium">{paidByMember?.name}</span> •{" "}
                                    {formatDate(expense.date)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                                    {formatCurrency(expense.amount)}
                                  </div>
                                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                                    {expense.category}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                  Split between:
                                </span>
                                {expense.splitBetween.map((memberId) => {
                                  const member = getMemberById(memberId);
                                  return (
                                    <div
                                      key={memberId}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs"
                                    >
                                      <span className="font-medium">{member?.name}</span>
                                      <span className="text-zinc-600 dark:text-zinc-400">
                                        ({formatCurrency(perPersonAmount)})
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Settlements Tab */}
          <TabsContent value="settlements" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Settlements
              </h2>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {activeSettlements.length} pending • {paidSettlements.size} settled
              </div>
            </div>

            {activeSettlements.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-8 h-8 text-green-600 dark:text-green-400"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                    All Settled Up!
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-center">
                    Everyone is settled. No pending payments.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeSettlements.map((settlement) => {
                  const fromMember = getMemberById(settlement.from);
                  const toMember = getMemberById(settlement.to);
                  const { message, type } = getSettlementMessage(settlement, currentUserId);

                  if (!fromMember || !toMember) return null;

                  return (
                    <Card key={settlement.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0">
                              {type === 'debt' ? toMember.avatar : fromMember.avatar}
                            </div>

                            {/* Settlement Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                  {message}
                                </h3>
                                {type === 'debt' && (
                                  <Badge variant="destructive" className="text-xs">
                                    You owe
                                  </Badge>
                                )}
                                {type === 'credit' && (
                                  <Badge className="text-xs bg-green-500">
                                    Owed to you
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                                ₹{settlement.amount.toFixed(2)}
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="w-4 h-4"
                                >
                                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                                <span>
                                  {fromMember.name} → {toMember.name}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => handleMarkPaid(settlement.id)}
                              className="whitespace-nowrap"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-4 h-4 mr-2"
                              >
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                              Mark Paid
                            </Button>
                            {type === 'credit' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendReminder(fromMember, toMember, settlement.amount)}
                                className="whitespace-nowrap"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="w-4 h-4 mr-2"
                                >
                                  <rect x="2" y="4" width="20" height="16" rx="2" />
                                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                                Send Reminder
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
