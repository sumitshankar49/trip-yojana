export const EXPENSE_LABELS = {
  PAGE_TITLE: "Expense Split",
  PAGE_DESCRIPTION_SELECTED: "Manage group expenses for",
  PAGE_DESCRIPTION_DEFAULT: "Select a trip to get started",

  NO_TRIPS_TITLE: "No trips available",
  NO_TRIPS_DESC: "Create a trip first to split expenses.",

  // Group Management
  GROUP_MANAGEMENT_TITLE: "Group Management",
  ADD_MEMBER_BUTTON: "Add Member",
  ADD_MEMBER_DIALOG_TITLE: "Add Trip Member",
  ADD_MEMBER_DIALOG_DESC:
    "Add group members with name and email for expense splitting.",
  MEMBER_NAME_LABEL: "Name",
  MEMBER_NAME_PLACEHOLDER: "Ex: Rahul",
  MEMBER_EMAIL_LABEL: "Email",
  MEMBER_EMAIL_PLACEHOLDER: "Ex: rahul@email.com",
  CANCEL_BUTTON: "Cancel",
  SAVE_MEMBER_BUTTON: "Save Member",
  REMOVE_BUTTON: "Remove",
  MEMBER_LIST_LABEL: "Member List",
  NO_MEMBERS_YET: "No members yet",
  OWNER_BADGE: "Owner",

  // Expense form
  ADD_EXPENSE_TITLE: "Add Expense",
  EXPENSE_TITLE_LABEL: "Title",
  EXPENSE_TITLE_PLACEHOLDER: "Ex: Hotel booking",
  AMOUNT_LABEL: "Amount",
  AMOUNT_PLACEHOLDER: "Ex: 2400",
  PAID_BY_LABEL: "Paid By",
  PAID_BY_PLACEHOLDER: "Select member",
  ADD_EXPENSE_BUTTON: "Add Expense",

  // Summary
  SUMMARY_TITLE: "Summary",
  TOTAL_EXPENSE_LABEL: "Total Expense",
  PER_PERSON_LABEL: "Per Person Split",
  MEMBERS_LABEL: "Members",
  SETTLEMENTS_LABEL: "Settlements",
} as const;

export const EXPENSE_MESSAGES = {
  // Toast errors
  SELECT_TRIP_FIRST: "Select a trip first",
  MEMBER_NAME_REQUIRED: "Member name is required",
  MEMBER_EMAIL_REQUIRED: "Valid member email is required",
  MEMBER_ALREADY_EXISTS: "Member already exists",
  EMAIL_ALREADY_EXISTS: "Email already exists in group",
  CANNOT_REMOVE_MEMBER: "Cannot remove member with existing expenses",
  CANNOT_REMOVE_OWNER: "Trip owner cannot be removed",
  EXPENSE_TITLE_REQUIRED: "Expense title is required",
  INVALID_AMOUNT: "Enter a valid amount",
  SELECT_WHO_PAID: "Select who paid",
  LOAD_TRIPS_FAILED: "Failed to load trips",
  LOAD_TRIPS_ERROR: "Could not load trips",

  // Toast success
  MEMBER_ADDED: "Member added",
  EXPENSE_ADDED: "Expense added",
} as const;
