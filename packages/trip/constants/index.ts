export const TRIP_LABELS = {
  PAGE_TITLE: "Create New Trip",
  PAGE_DESCRIPTION:
    "Build your itinerary in three guided steps with real-time validation and instant dashboard sync.",
  WIZARD_BADGE: "TRIP PLANNER WIZARD",

  // Step labels
  STEP_1_LABEL: "Location",
  STEP_1_HINT: "Route",
  STEP_2_LABEL: "Dates",
  STEP_2_HINT: "Schedule",
  STEP_3_LABEL: "Details",
  STEP_3_HINT: "Preferences",

  // Step headers
  STEP_1_BADGE: "Step 1: Route",
  STEP_2_BADGE: "Step 2: Travel Window",
  STEP_3_BADGE: "Step 3: Preferences",

  STEP_1_TITLE: "Where are you traveling?",
  STEP_2_TITLE: "When is your trip?",
  STEP_3_TITLE: "Trip details",

  STEP_1_DESC: "Enter your departure and destination locations",
  STEP_2_DESC: "Select your travel dates",
  STEP_3_DESC: "Set your budget and travel preferences",

  // Form labels
  SOURCE_LABEL: "Source",
  SOURCE_HINT: "Where your journey starts.",
  SOURCE_PLACEHOLDER: "Ex: Delhi",

  DESTINATION_LABEL: "Destination",
  DESTINATION_HINT: "Where you want to travel.",
  DESTINATION_PLACEHOLDER: "Ex: Goa",

  START_DATE_LABEL: "Start Date",
  END_DATE_LABEL: "End Date",
  PICK_A_DATE: "Pick a date",

  BUDGET_LABEL: "Budget",
  BUDGET_MIN_LABEL: "₹5,000",
  BUDGET_MAX_LABEL: "₹5,00,000",
  TRAVEL_TYPE_LABEL: "Travel Type",
  TRAVEL_TYPE_PLACEHOLDER: "Select travel type",

  TRIP_SUMMARY_TITLE: "Trip Summary",
  SUMMARY_FROM: "From:",
  SUMMARY_TO: "To:",
  SUMMARY_DATES: "Dates:",
  SUMMARY_BUDGET: "Budget:",
  SUMMARY_DURATION: "Duration:",
  SUMMARY_TYPE: "Type:",
  NOT_SET: "Not set",

  // Travel type options
  SOLO: "Solo Travel",
  FAMILY: "Family Trip",
  FRIENDS: "Trip with Friends",

  // Buttons
  BACK_BUTTON: "Back",
  NEXT_BUTTON: "Next",
  CREATE_TRIP_BUTTON: "Create Trip",
  CREATING_BUTTON: "Creating...",

  PROGRESS_LABEL: "Progress",
  STEP_OF: "Step",
  OF: "of",
} as const;

export const TRIP_MESSAGES = {
  // Toast success
  TRIP_CREATED: "Trip created successfully",

  // Toast errors
  DATES_REQUIRED: "Please select both start and end dates",
  CREATE_FAILED: "Failed to create trip",
  GENERIC_ERROR: "Something went wrong while creating trip",
} as const;

export const TRIP_ERRORS = {
  SOURCE_REQUIRED: "Source is required",
  DESTINATION_REQUIRED: "Destination is required",
  DESTINATION_SAME: "Destination must be different from source",
  START_DATE_REQUIRED: "Start date is required",
  END_DATE_REQUIRED: "End date is required",
  END_DATE_BEFORE_START: "End date must be after start date",
  TRAVEL_TYPE_REQUIRED: "Travel type is required",
} as const;
