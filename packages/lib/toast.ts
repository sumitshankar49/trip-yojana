import { toast as sonnerToast, ExternalToast } from "sonner";

/**
 * Enhanced toast utility with pre-configured success, error, info, and warning toasts
 * Built on top of Sonner for beautiful toast notifications
 */

export const toast = {
  /**
   * Success toast with green checkmark
   */
  success: (message: string, options?: ExternalToast) => {
    return sonnerToast.success(message, {
      duration: 4000,
      ...options,
    });
  },

  /**
   * Error toast with red X
   */
  error: (message: string, options?: ExternalToast) => {
    return sonnerToast.error(message, {
      duration: 5000,
      ...options,
    });
  },

  /**
   * Info toast with blue info icon
   */
  info: (message: string, options?: ExternalToast) => {
    return sonnerToast.info(message, {
      duration: 4000,
      ...options,
    });
  },

  /**
   * Warning toast with yellow warning icon
   */
  warning: (message: string, options?: ExternalToast) => {
    return sonnerToast.warning(message, {
      duration: 4000,
      ...options,
    });
  },

  /**
   * Loading toast that can be updated
   */
  loading: (message: string, options?: ExternalToast) => {
    return sonnerToast.loading(message, options);
  },

  /**
   * Promise toast - automatically shows loading, success, or error
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  /**
   * Custom toast with full control
   */
  custom: (message: string, options?: ExternalToast) => {
    return sonnerToast(message, options);
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId);
  },
};

// Pre-configured common toasts
export const commonToasts = {
  // Trip-related
  tripCreated: () => toast.success("Trip created successfully! 🎉"),
  tripUpdated: () => toast.success("Trip updated successfully"),
  tripDeleted: () => toast.success("Trip deleted"),

  // Expense-related
  expenseAdded: () => toast.success("Expense added successfully 💰"),
  expenseUpdated: () => toast.success("Expense updated"),
  expenseDeleted: () => toast.success("Expense deleted"),

  // Budget-related
  budgetExceeded: () => toast.warning("Budget limit exceeded! ⚠️"),
  budgetNearLimit: (percentage: number) =>
    toast.warning(`You've used ${percentage}% of your budget`),

  // Itinerary-related
  activityAdded: () => toast.success("Activity added to itinerary 📅"),
  activityUpdated: () => toast.success("Activity updated"),

  // Generic
  saved: () => toast.success("Changes saved"),
  copied: () => toast.success("Copied to clipboard"),
  
  // Errors
  networkError: () => toast.error("Network error. Please try again"),
  serverError: () => toast.error("Server error. Please try again later"),
  unauthorized: () => toast.error("You're not authorized to do this"),
  notFound: () => toast.error("Item not found"),
  
  // Loading states
  saving: () => toast.loading("Saving..."),
  loading: () => toast.loading("Loading..."),
  processing: () => toast.loading("Processing..."),
};

// Async operation helper
export const toastAsync = async <T,>(
  asyncFn: () => Promise<T>,
  messages: {
    loading: string;
    success: string;
    error?: string;
  }
): Promise<T> => {
  const toastId = toast.loading(messages.loading);
  
  try {
    const result = await asyncFn();
    toast.dismiss(toastId);
    toast.success(messages.success);
    return result;
  } catch (error) {
    toast.dismiss(toastId);
    toast.error(messages.error || "Something went wrong");
    throw error;
  }
};
