export const BUDGET_LABELS = {
  PAGE_TITLE: "Budget Tracker",

  // Summary cards
  TOTAL_BUDGET_LABEL: "Total Budget",
  TOTAL_BUDGET_DESC: "Allocated for entire trip",
  TOTAL_SPENT_LABEL: "Total Spent",
  REMAINING_LABEL: "Remaining",
  REMAINING_DESC: "Available to spend",

  // Progress section
  OVERALL_PROGRESS_TITLE: "Overall Budget Progress",

  // Category section
  CATEGORY_SECTION_TITLE: "Budget by Category",

  // Empty states
  NO_CATEGORY_BUDGETS: "No category budgets yet",
  NO_CATEGORY_DESC: "Add expenses to track spending by category",
  NO_SPENDING_DATA: "No spending data yet",
  NO_SPENDING_DESC: "Your spending breakdown will appear here once you add expenses",

  // Chart
  SPENDING_DISTRIBUTION_TITLE: "Spending Distribution",
} as const;

export const BUDGET_MESSAGES = {
  // Toast errors
  LOAD_TRIPS_FAILED: "Failed to load trips",
  LOAD_TRIPS_ERROR: "Could not load trips",
} as const;

export const BUDGET_THRESHOLDS = {
  CRITICAL: 90,
  WARNING: 70,
} as const;

export const BUDGET_PROGRESS_COLORS = {
  CRITICAL: "bg-red-500",
  WARNING: "bg-amber-500",
  SAFE: "bg-emerald-500",
} as const;

export function getProgressColor(percentage: number): string {
  if (percentage >= BUDGET_THRESHOLDS.CRITICAL) return BUDGET_PROGRESS_COLORS.CRITICAL;
  if (percentage >= BUDGET_THRESHOLDS.WARNING) return BUDGET_PROGRESS_COLORS.WARNING;
  return BUDGET_PROGRESS_COLORS.SAFE;
}
