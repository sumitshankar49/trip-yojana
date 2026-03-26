export const BUDGET_LABELS = {
  TOTAL_BUDGET: "Total Budget",
  TOTAL_SPENT: "Total Spent",
  REMAINING: "Remaining",
  OVERALL_PROGRESS: "Overall Progress",
  CATEGORY_BREAKDOWN: "Category Breakdown",
  SPENDING_DISTRIBUTION: "Spending Distribution",
  BUDGETED: "Budgeted",
  SPENT: "Spent",
} as const;

export const BUDGET_CATEGORIES = {
  TRAVEL: {
    name: "Travel",
    icon: "✈️",
    color: "bg-blue-500",
  },
  HOTEL: {
    name: "Hotel",
    icon: "🏨",
    color: "bg-purple-500",
  },
  FOOD: {
    name: "Food",
    icon: "🍽️",
    color: "bg-orange-500",
  },
  ACTIVITIES: {
    name: "Activities",
    icon: "🎭",
    color: "bg-green-500",
  },
} as const;
