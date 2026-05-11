"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "@/packages/lib/toast";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/packages/components/ui/card";import { Button } from "@/packages/components/ui/button";
import { Form } from "@/packages/components/ui/form";
import { AuthMode, FormErrors } from "./types";
import { AUTH_LABELS, AUTH_MESSAGES } from "./constants";
import { validateName, validateEmail, validatePassword, validateConfirmPassword } from "./validations";
import { FormPageViewSingleInputLayout } from "@/packages/components/shared/form/FormPageViewSingleInputLayout";
import { InputFieldControlled } from "@/packages/components/shared/form/InputFieldControlled";
import { useForm, useWatch } from "react-hook-form";

type AuthFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMode = searchParams.get("mode");
  const [mode, setMode] = useState<AuthMode>(
    requestedMode === "signup" || requestedMode === "login" ? requestedMode : "login"
  );
  const form = useForm<AuthFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const nameValue = useWatch({ control: form.control, name: "name" }) || "";
  const emailValue = useWatch({ control: form.control, name: "email" }) || "";
  const passwordValue = useWatch({ control: form.control, name: "password" }) || "";
  const confirmPasswordValue = useWatch({ control: form.control, name: "confirmPassword" }) || "";
  const isAuthFormReady =
    mode === "login"
      ? emailValue.trim().length > 0 && passwordValue.trim().length > 0
      : nameValue.trim().length > 0 &&
        emailValue.trim().length > 0 &&
        passwordValue.trim().length > 0 &&
        confirmPasswordValue.trim().length > 0;

  const inputBaseClassName = "h-12 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg transition-all duration-300 focus:scale-[1.01]";

  const clearFieldError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverError) setServerError("");
  };

  const clearAllFormValues = () => {
    form.reset({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const formValues = form.getValues();

    // Name validation (only for signup)
    if (mode === "signup") {
      const nameError = validateName(formValues.name);
      if (nameError) newErrors.name = nameError;
    }

    // Email validation
    const emailError = validateEmail(formValues.email);
    if (emailError) newErrors.email = emailError;

    // Password validation
    const passwordError = validatePassword(formValues.password);
    if (passwordError) newErrors.password = passwordError;

    // Confirm password validation (only for signup)
    if (mode === "signup") {
      const confirmPasswordError = validateConfirmPassword(
        formValues.password,
        formValues.confirmPassword
      );
      if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "signup") {
        // Register new user
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.getValues("name"),
            email: form.getValues("email"),
            password: form.getValues("password"),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setServerError(data.message || "Registration failed");
          setIsLoading(false);
          return;
        }

        toast.success("Account created successfully! Please log in.");
        
        // Switch to login mode after successful registration
        setMode("login");
        router.replace("/auth?mode=login");
        form.reset({
          name: "",
          email: form.getValues("email"),
          password: "",
          confirmPassword: "",
        });
        setErrors({});
        setServerError("");
        setIsLoading(false);
      } else {
        // Login existing user
        const result = await signIn("credentials", {
          email: form.getValues("email"),
          password: form.getValues("password"),
          redirect: false,
        });

        if (result?.error) {
          const msg =
            result.error === "CredentialsSignin"
              ? "Invalid email or password"
              : result.error;
          setServerError(msg);
          setIsLoading(false);
          return;
        }

        if (result?.ok) {
          toast.success("Login successful!");
          
          // Reset form
          clearAllFormValues();
          setErrors({});
          
          // Navigate to dashboard
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    const nextMode = mode === "login" ? "signup" : "login";
    setMode(nextMode);
    router.replace(`/auth?mode=${nextMode}`);
    setErrors({});
    setServerError("");
    clearAllFormValues();
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[55%_45%]">
      {/* Left Side - Image (Hidden on mobile) */}
      <div className="hidden lg:flex relative bg-linear-to-br from-sky-600 via-cyan-500 to-blue-500 overflow-hidden">
        {/* Background Image - Full Cover */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/login.png"
            alt={`${AUTH_LABELS.APP_NAME} - Travel Planning`}
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-linear-to-br from-sky-600/40 via-cyan-500/40 to-blue-500/40"></div>
        
        {/* Content on top */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-end p-10 pb-16">
          <div className="w-full max-w-2xl">
            <h1 className="text-5xl lg:text-6xl font-bold mb-3 text-white drop-shadow-lg">
              {AUTH_LABELS.APP_NAME}
            </h1>
            <p className="text-base lg:text-lg text-white font-medium drop-shadow-md">
              {AUTH_LABELS.APP_DESCRIPTION}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center bg-[#F5F5F5] dark:bg-zinc-950 p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="relative w-48 h-16 mx-auto mb-3">
              <Image
                src="/brand_logo.png"
                alt={AUTH_LABELS.APP_NAME}
                fill
                className="object-contain"
                priority
              />
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{AUTH_LABELS.TAGLINE}</p>
          </div>

          <Form {...form}>
          <Card className="border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 rounded-2xl animate-fade-in-up animation-delay-200">
            <CardHeader key={`header-${mode}`} className="space-y-1 pb-6 px-8 pt-8 animate-fade-in animation-delay-400">
              <CardTitle className="text-2xl font-bold text-center text-zinc-900 dark:text-white transition-all duration-300">
                {mode === "login" ? AUTH_LABELS.LOGIN_TITLE : AUTH_LABELS.SIGNUP_TITLE}
              </CardTitle>
            </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent key={`content-${mode}`} className="px-8 animate-fade-in-up animation-delay-200">
            <FormPageViewSingleInputLayout height="h-fit">
              {mode === "signup" && (
                <div className="space-y-2">
                  <InputFieldControlled
                    control={form.control}
                    name="name"
                    label={AUTH_LABELS.NAME_LABEL}
                    placeholder={AUTH_LABELS.NAME_PLACEHOLDER}
                    type="text"
                    disabled={isLoading}
                    className={inputBaseClassName}
                    required
                    onChange={() => clearFieldError("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.name}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <InputFieldControlled
                  control={form.control}
                  name="email"
                  label={AUTH_LABELS.EMAIL_LABEL}
                  placeholder={AUTH_LABELS.EMAIL_PLACEHOLDER}
                  type="email"
                  disabled={isLoading}
                  className={inputBaseClassName}
                  required
                  onChange={() => clearFieldError("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                    {AUTH_LABELS.PASSWORD_LABEL}
                  </span>
                  {mode === "login" && (
                    <a
                      href="/forgot-password"
                      className="text-xs text-cyan-600 dark:text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-400 font-semibold hover:underline underline-offset-2 transition-colors duration-200"
                    >
                      Forgot password?
                    </a>
                  )}
                </div>
                <InputFieldControlled
                  control={form.control}
                  name="password"
                  placeholder={AUTH_LABELS.PASSWORD_PLACEHOLDER}
                  type={showPassword ? "text" : "password"}
                  disabled={isLoading}
                  className={inputBaseClassName}
                  required
                  onChange={() => clearFieldError("password")}
                  endAdornment={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  }
                />
                {errors.password && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.password}</p>
                )}
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <InputFieldControlled
                    control={form.control}
                    name="confirmPassword"
                    label={AUTH_LABELS.CONFIRM_PASSWORD_LABEL}
                    placeholder={AUTH_LABELS.PASSWORD_PLACEHOLDER}
                    type={showConfirmPassword ? "text" : "password"}
                    disabled={isLoading}
                    className={inputBaseClassName}
                    required
                    onChange={() => clearFieldError("confirmPassword")}
                    endAdornment={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    }
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}
            </FormPageViewSingleInputLayout>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 px-8 pb-8 pt-2 animate-fade-in animation-delay-800">
            {serverError && (
              <div className="w-full flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">{serverError}</p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg uppercase tracking-wide hover:scale-[1.01] active:scale-[0.99]"
              disabled={isLoading || !isAuthFormReady}
            >
              {isLoading
                ? mode === "login"
                  ? AUTH_MESSAGES.SIGNING_IN
                  : AUTH_MESSAGES.CREATING_ACCOUNT
                : mode === "login"
                ? AUTH_LABELS.SIGN_IN_BUTTON
                : AUTH_LABELS.SIGN_UP_BUTTON}
            </Button>

            <div className="text-sm text-center text-zinc-600 dark:text-zinc-400 pt-2">
              {mode === "login" ? (
                <>
                  {AUTH_LABELS.DONT_HAVE_ACCOUNT}{" "}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-cyan-600 dark:text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-400 font-bold transition-all duration-200 hover:underline underline-offset-2"
                    disabled={isLoading}
                  >
                    {AUTH_LABELS.SIGN_UP_BUTTON}
                  </button>
                </>
              ) : (
                <>
                  {AUTH_LABELS.ALREADY_HAVE_ACCOUNT}{" "}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-cyan-600 dark:text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-400 font-bold transition-all duration-200 hover:underline underline-offset-2"
                    disabled={isLoading}
                  >
                    {AUTH_LABELS.SIGN_IN_BUTTON}
                  </button>
                </>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
          </Form>
        </div>
      </div>
    </div>
  );
}
