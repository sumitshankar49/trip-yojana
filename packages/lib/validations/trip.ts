import { TRIP_MESSAGES } from "@/packages/constants/trip";

export const validateTripDestination = (destination: string): string | undefined => {
  if (!destination) {
    return TRIP_MESSAGES.DESTINATION_REQUIRED;
  }
  return undefined;
};

export const validateTripDates = (
  startDate: Date | undefined,
  endDate: Date | undefined
): { startDate?: string; endDate?: string } => {
  const errors: { startDate?: string; endDate?: string } = {};

  if (!startDate) {
    errors.startDate = TRIP_MESSAGES.START_DATE_REQUIRED;
  }
  if (!endDate) {
    errors.endDate = TRIP_MESSAGES.END_DATE_REQUIRED;
  }
  if (startDate && endDate && endDate <= startDate) {
    errors.endDate = TRIP_MESSAGES.END_DATE_AFTER_START;
  }

  return errors;
};

export const validateTripDetails = (
  groupSize: number,
  budget: number
): { groupSize?: string; budget?: string } => {
  const errors: { groupSize?: string; budget?: string } = {};

  if (!groupSize) {
    errors.groupSize = TRIP_MESSAGES.GROUP_SIZE_REQUIRED;
  } else if (groupSize < 1) {
    errors.groupSize = TRIP_MESSAGES.GROUP_SIZE_POSITIVE;
  }

  if (!budget) {
    errors.budget = TRIP_MESSAGES.BUDGET_REQUIRED;
  } else if (budget <= 0) {
    errors.budget = TRIP_MESSAGES.BUDGET_POSITIVE;
  }

  return errors;
};
