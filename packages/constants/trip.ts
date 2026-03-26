export const TRIP_LABELS = {
  DESTINATION: "Destination",
  START_DATE: "Start Date",
  END_DATE: "End Date",
  GROUP_SIZE: "Group Size",
  BUDGET: "Budget",
  TRAVEL_TYPE: "Travel Type",
  DESTINATION_PLACEHOLDER: "e.g., Golden Temple, Amritsar",
  SELECT_DATE: "Pick a date",
  SELECT_TRAVEL_TYPE: "Select travel type",
  CREATE_TRIP: "Create Trip",
  NEXT: "Next",
  PREVIOUS: "Previous",
} as const;

export const TRIP_MESSAGES = {
  DESTINATION_REQUIRED: "Destination is required",
  START_DATE_REQUIRED: "Start date is required",
  END_DATE_REQUIRED: "End date is required",
  END_DATE_AFTER_START: "End date must be after start date",
  GROUP_SIZE_REQUIRED: "Group size is required",
  GROUP_SIZE_POSITIVE: "Group size must be at least 1",
  BUDGET_REQUIRED: "Budget is required",
  BUDGET_POSITIVE: "Budget must be greater than 0",
  TRAVEL_TYPE_REQUIRED: "Travel type is required",
} as const;

export const TRAVEL_TYPES = [
  { value: "leisure", label: "Leisure" },
  { value: "business", label: "Business" },
  { value: "adventure", label: "Adventure" },
  { value: "family", label: "Family" },
] as const;

export const STEP_TITLES = [
  "Basic Information",
  "Travel Dates & Group",
  "Budget & Preferences",
] as const;
