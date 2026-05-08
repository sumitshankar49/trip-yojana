export type AuthMode = "login" | "signup";

export interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export interface AuthFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
