export const EXPENSE_LABELS = {
  ADD_MEMBER: "Add Member",
  ADD_EXPENSE: "Add Expense",
  MEMBER_NAME: "Member Name",
  MEMBER_EMAIL: "Email Address",
  EXPENSE_DESCRIPTION: "Description",
  AMOUNT: "Amount",
  PAID_BY: "Paid By",
  SPLIT_BETWEEN: "Split Between",
  CATEGORY: "Category",
  SETTLEMENTS: "Settlements",
  MARK_AS_PAID: "Mark as Paid",
  SEND_REMINDER: "Send Reminder",
  MEMBERS: "Members",
  EXPENSES: "Expenses",
} as const;

export const EXPENSE_MESSAGES = {
  MEMBER_ADDED: "Member Added",
  MEMBER_ADDED_DESC: (name: string) => `${name} has been added to the group.`,
  EXPENSE_ADDED: "Expense Added",
  EXPENSE_ADDED_DESC: (payer: string, amount: number, description: string) =>
    `${payer} paid ₹${amount.toFixed(2)} for ${description}`,
  PAYMENT_SETTLED: "Payment Marked as Settled",
  REMINDER_SENT: "Reminder Sent",
  REMINDER_SENT_TO: (name: string) => `Reminder Sent to ${name}`,
  MISSING_INFO: "Missing Information",
  MISSING_INFO_DESC: "Please enter both name and email.",
  INCOMPLETE_EXPENSE: "Incomplete Expense",
  INCOMPLETE_EXPENSE_DESC:
    "Please fill all fields and select members to split with.",
} as const;

export const EXPENSE_CATEGORIES = [
  { value: "food", label: "Food & Dining" },
  { value: "transport", label: "Transportation" },
  { value: "accommodation", label: "Accommodation" },
  { value: "activities", label: "Activities" },
  { value: "shopping", label: "Shopping" },
  { value: "other", label: "Other" },
] as const;
