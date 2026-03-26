export type AuthMode = "login" | "signup";

export interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword: string;
}
