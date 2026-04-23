"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/packages/components/ui/card";
import { Input } from "@/packages/components/ui/input";
import { Label } from "@/packages/components/ui/label";
import { Button } from "@/packages/components/ui/button";
import { AuthMode, FormErrors } from "./types";
import { AUTH_LABELS, AUTH_MESSAGES } from "./constants";
import { validateName, validateEmail, validatePassword, validateConfirmPassword } from "./validations";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMode = searchParams.get("mode");
  const [mode, setMode] = useState<AuthMode>(
    requestedMode === "signup" || requestedMode === "login" ? requestedMode : "login"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  
  const [authFormData, setAuthFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const inputBaseClassName = "h-12 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg transition-all duration-300 focus:scale-[1.01]";

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation (only for signup)
    if (mode === "signup") {
      const nameError = validateName(authFormData.name);
      if (nameError) newErrors.name = nameError;
    }

    // Email validation
    const emailError = validateEmail(authFormData.email);
    if (emailError) newErrors.email = emailError;

    // Password validation
    const passwordError = validatePassword(authFormData.password);
    if (passwordError) newErrors.password = passwordError;

    // Confirm password validation (only for signup)
    if (mode === "signup") {
      const confirmPasswordError = validateConfirmPassword(
        authFormData.password,
        authFormData.confirmPassword
      );
      if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
            name: authFormData.name,
            email: authFormData.email,
            password: authFormData.password,
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
        setAuthFormData({ name: "", email: authFormData.email, password: "", confirmPassword: "" });
        setErrors({});
        setServerError("");
        setIsLoading(false);
      } else {
        // Login existing user
        const result = await signIn("credentials", {
          email: authFormData.email,
          password: authFormData.password,
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
          setAuthFormData({ name: "", email: "", password: "", confirmPassword: "" });
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
    setAuthFormData({ name: "", email: "", password: "", confirmPassword: "" });
  };

  const handleInputChange = (field: keyof typeof authFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAuthFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear field and server error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverError) setServerError("");
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

          <Card className="border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 rounded-2xl animate-fade-in-up animation-delay-200">
            <CardHeader key={`header-${mode}`} className="space-y-1 pb-6 px-8 pt-8 animate-fade-in animation-delay-400">
              <CardTitle className="text-2xl font-bold text-center text-zinc-900 dark:text-white transition-all duration-300">
                {mode === "login" ? AUTH_LABELS.LOGIN_TITLE : AUTH_LABELS.SIGNUP_TITLE}
              </CardTitle>
            </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent key={`content-${mode}`} className="space-y-4 px-8 animate-fade-in-up animation-delay-200">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                  {AUTH_LABELS.NAME_LABEL}
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={AUTH_LABELS.NAME_PLACEHOLDER}
                  value={authFormData.name}
                  onChange={handleInputChange("name")}
                  aria-invalid={!!errors.name}
                  disabled={isLoading}
                  className={inputBaseClassName}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.name}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                {AUTH_LABELS.EMAIL_LABEL}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={AUTH_LABELS.EMAIL_PLACEHOLDER}
                value={authFormData.email}
                onChange={handleInputChange("email")}
                aria-invalid={!!errors.email}
                disabled={isLoading}
                className={inputBaseClassName}
              />
              {errors.email && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                  {AUTH_LABELS.PASSWORD_LABEL}
                </Label>
                {mode === "login" && (
                  <a
                    href="/forgot-password"
                    className="text-xs text-cyan-600 dark:text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-400 font-semibold hover:underline underline-offset-2 transition-colors duration-200"
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder={AUTH_LABELS.PASSWORD_PLACEHOLDER}
                value={authFormData.password}
                onChange={handleInputChange("password")}
                aria-invalid={!!errors.password}
                disabled={isLoading}
                className={inputBaseClassName}
              />
              {errors.password && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.password}</p>
              )}
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                  {AUTH_LABELS.CONFIRM_PASSWORD_LABEL}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={AUTH_LABELS.PASSWORD_PLACEHOLDER}
                  value={authFormData.confirmPassword}
                  onChange={handleInputChange("confirmPassword")}
                  aria-invalid={!!errors.confirmPassword}
                  disabled={isLoading}
                  className={inputBaseClassName}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}
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
              disabled={isLoading}
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
        </div>
      </div>
    </div>
  );
}
