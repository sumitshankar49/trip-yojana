export const AUTH_LABELS = {
  LOGIN_TITLE: "Login",
  SIGNUP_TITLE: "Create Account",
  EMAIL_LABEL: "Email",
  PASSWORD_LABEL: "Password",
  CONFIRM_PASSWORD_LABEL: "Confirm Password",
  SIGN_IN_BUTTON: "Sign in",
  SIGN_UP_BUTTON: "Sign up",
  DONT_HAVE_ACCOUNT: "Don't have an account?",
  ALREADY_HAVE_ACCOUNT: "Already have an account?",
  EMAIL_PLACEHOLDER: "name@example.com",
  PASSWORD_PLACEHOLDER: "••••••••",
  TAGLINE: "Travel Planning Made Easy",
  APP_NAME: "TripYojana",
  APP_DESCRIPTION: "Plan your perfect journey with ease. Manage trips, budgets, and itineraries all in one place.",
} as const;

export const AUTH_MESSAGES = {
  EMAIL_REQUIRED: "Email is required",
  EMAIL_INVALID: "Please enter a valid email address",
  PASSWORD_REQUIRED: "Password is required",
  PASSWORD_MIN_LENGTH: "Password must be at least 6 characters",
  CONFIRM_PASSWORD_REQUIRED: "Please confirm your password",
  PASSWORDS_DO_NOT_MATCH: "Passwords do not match",
  SIGNING_IN: "Signing in...",
  CREATING_ACCOUNT: "Creating account...",
} as const;

export const AUTH_VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;
