export const ITINERARY_LABELS = {
  PAGE_TITLE: "AI Itinerary Generator",
  PAGE_DESCRIPTION:
    "Enter destination, days, and interests to generate a day-wise timeline with morning, afternoon, and evening slots.",

  // Form labels
  TRIP_LABEL: "Trip",
  TRIP_PLACEHOLDER_LOADING: "Loading trips...",
  TRIP_PLACEHOLDER: "Select trip",

  DESTINATION_LABEL: "Destination",
  DESTINATION_PLACEHOLDER: "Ex: Jaipur",

  DAYS_LABEL: "Days",
  INTERESTS_LABEL: "Interests",

  // Buttons
  GENERATE_BUTTON: "Generate",
  SAVE_BUTTON: "Save",
  SAVING_BUTTON: "Saving...",

  // Stat labels
  GENERATED_DAYS_LABEL: "Generated Days",
  TIMELINE_SLOTS_LABEL: "Timeline Slots",

  // Map loading
  MAP_LOADING: "Loading map...",

  // Drag hint
  DRAG_HINT:
    "Drag and drop timeline cards to reorder slots across days.",
  AUTO_SAVE_LABEL: "Auto-save:",
  AUTO_SAVE_ON: "On",
  AUTO_SAVE_SAVING: "Saving...",
} as const;

export const ITINERARY_MESSAGES = {
  // Toast errors
  DESTINATION_REQUIRED: "Destination is required",
  DAYS_OUT_OF_RANGE: "Days must be between 1 and 14",
  SELECT_TRIP_FIRST: "Select a trip first",
  GENERATE_BEFORE_SAVE: "Generate itinerary before saving",
  SAVE_FAILED: "Failed to save itinerary",
  SAVE_ERROR: "Could not save itinerary",
  LOAD_TRIPS_FAILED: "Failed to load trips",
  LOAD_TRIPS_ERROR: "Could not load trips",
  LOAD_ITINERARY_FAILED: "Failed to load itinerary",
  LOAD_ITINERARY_ERROR: "Could not load itinerary",

  // Toast success
  GENERATED_SUCCESS: "Optimized itinerary generated successfully",
  AUTO_SAVED: "Itinerary auto-saved",
  SAVED_TO_DB: "Itinerary saved to database",
} as const;
