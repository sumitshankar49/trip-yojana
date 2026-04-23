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
} as const;

export const BUDGET_MESSAGES = {
  // Toast errors
  LOAD_TRIPS_FAILED: "Failed to load trips",
  LOAD_TRIPS_ERROR: "Could not load trips",
} as const;
