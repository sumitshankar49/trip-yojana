import { AUTH_VALIDATION, AUTH_MESSAGES } from "../constants";

export const validateEmail = (email: string): string | undefined => {
  if (!email) {
    return AUTH_MESSAGES.EMAIL_REQUIRED;
  }
  if (!AUTH_VALIDATION.EMAIL_REGEX.test(email)) {
    return AUTH_MESSAGES.EMAIL_INVALID;
  }
  return undefined;
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return AUTH_MESSAGES.PASSWORD_REQUIRED;
  }
  if (password.length < AUTH_VALIDATION.MIN_PASSWORD_LENGTH) {
    return AUTH_MESSAGES.PASSWORD_MIN_LENGTH;
  }
  return undefined;
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | undefined => {
  if (!confirmPassword) {
    return AUTH_MESSAGES.CONFIRM_PASSWORD_REQUIRED;
  }
  if (password !== confirmPassword) {
    return AUTH_MESSAGES.PASSWORDS_DO_NOT_MATCH;
  }
  return undefined;
};
