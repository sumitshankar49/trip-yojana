"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/packages/components/ui/card";
import { Input } from "@/packages/components/ui/input";
import { Label } from "@/packages/components/ui/label";
import { Button } from "@/packages/components/ui/button";
import { AuthMode, FormErrors } from "./types";
import { AUTH_LABELS, AUTH_MESSAGES } from "./constants";
import { validateEmail, validatePassword, validateConfirmPassword } from "./validations";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    // Password validation
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    // Confirm password validation (only for signup)
    if (mode === "signup") {
      const confirmPasswordError = validateConfirmPassword(
        formData.password,
        formData.confirmPassword
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

    // Simulate API call
    setTimeout(() => {
      console.log(`${mode} submitted:`, {
        email: formData.email,
        password: formData.password,
      });
      
      // Reset form after successful submission
      setFormData({ email: "", password: "", confirmPassword: "" });
      setErrors({});
      
      // Navigate to dashboard
      router.push("/dashboard");
    }, 2000);
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setErrors({});
    setFormData({ email: "", password: "", confirmPassword: "" });
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[55%_45%]">
      {/* Left Side - Image (Hidden on mobile) */}
      <div className="hidden lg:flex relative bg-linear-to-br from-purple-600 via-blue-500 to-green-400 overflow-hidden">
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
        <div className="absolute inset-0 bg-linear-to-br from-purple-600/40 via-blue-500/40 to-green-400/40"></div>
        
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
        <div className="w-full max-w-md">
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

          <Card className="border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 rounded-2xl">
            <CardHeader className="space-y-1 pb-6 px-8 pt-8">
              <CardTitle className="text-2xl font-bold text-center text-zinc-900 dark:text-white">
                {mode === "login" ? AUTH_LABELS.LOGIN_TITLE : AUTH_LABELS.SIGNUP_TITLE}
              </CardTitle>
            </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                {AUTH_LABELS.EMAIL_LABEL}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={AUTH_LABELS.EMAIL_PLACEHOLDER}
                value={formData.email}
                onChange={handleInputChange("email")}
                aria-invalid={!!errors.email}
                disabled={isLoading}
                className="h-12 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg"
              />
              {errors.email && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                {AUTH_LABELS.PASSWORD_LABEL}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={AUTH_LABELS.PASSWORD_PLACEHOLDER}
                value={formData.password}
                onChange={handleInputChange("password")}
                aria-invalid={!!errors.password}
                disabled={isLoading}
                className="h-12 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg"
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
                  value={formData.confirmPassword}
                  onChange={handleInputChange("confirmPassword")}
                  aria-invalid={!!errors.confirmPassword}
                  disabled={isLoading}
                  className="h-12 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 px-8 pb-8 pt-2">
            {/* Demo Credentials */}
            {mode === "login" && (
              <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-2">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">Demo Credentials:</p>
                <div className="space-y-1 text-xs text-blue-800 dark:text-blue-400">
                  <p><span className="font-medium">Email:</span> demo@tripyojana.com</p>
                  <p><span className="font-medium">Password:</span> Demo@123</p>
                </div>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full h-12 bg-linear-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg uppercase tracking-wide"
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
                    className="text-cyan-600 dark:text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-400 font-bold transition-colors"
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
                    className="text-cyan-600 dark:text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-400 font-bold transition-colors"
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
