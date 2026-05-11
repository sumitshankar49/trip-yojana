"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/packages/components/ui/card";
import { Button } from "@/packages/components/ui/button";
import { Form } from "@/packages/components/ui/form";
import { FormPageViewSingleInputLayout } from "@/packages/components/shared/form/FormPageViewSingleInputLayout";
import { InputFieldControlled } from "@/packages/components/shared/form/InputFieldControlled";
import { useForm } from "react-hook-form";

type Step = "email" | "otp" | "reset" | "success";

type ForgotPasswordFormValues = {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
};

const inputBaseClassName =
  "h-12 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg transition-all duration-300 focus:scale-[1.01]";

const LABELS = {
  email: "Email Address",
  otp: "One-Time Password",
  newPassword: "New Password",
  confirmPassword: "Confirm Password",
} as const;

const PLACEHOLDERS = {
  email: "name@example.com",
  otp: "Enter 6-digit OTP",
  password: "........",
} as const;

const ERROR_MESSAGES = {
  emailRequired: "Email is required",
  emailInvalid: "Please enter a valid email address",
  otpRequired: "Please enter the 6-digit OTP sent to your email",
  otpLength: "OTP must be exactly 6 digits \u2014 please check your email",
  otpInvalid: "Invalid OTP. Please check and try again.",
  passwordRequired: "Please enter a new password",
  passwordTooShort: "Password must be at least 6 characters long",
  confirmRequired: "Please confirm your new password",
  passwordMismatch: "Passwords don't match \u2014 please re-enter your new password",
  resetFailed: "Failed to reset password. Please try again.",
  sendOtpFailed: "Failed to send OTP",
  genericError: "Something went wrong. Please try again.",
} as const;

const TOAST_MESSAGES = {
  otpSent: "OTP sent! Check your inbox.",
  otpVerified: "OTP verified!",
  passwordReset: "Password reset successfully! Please log in.",
} as const;

const BUTTON_LABELS = {
  sendOtp: "Send OTP",
  sendingOtp: "Sending OTP...",
  verifyOtp: "Verify OTP",
  verifying: "Verifying...",
  resetPassword: "Reset Password",
  resetting: "Resetting...",
  backToLogin: "Back to Login",
  resendOtp: "Resend OTP",
} as const;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const form = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const [step, setStep] = useState<Step>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Step 1: Send OTP ──────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const emailValue = form.getValues("email").trim();

    if (!emailValue) newErrors.email = ERROR_MESSAGES.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue))
      newErrors.email = ERROR_MESSAGES.emailInvalid;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors({ email: data.message || ERROR_MESSAGES.sendOtpFailed });
        setIsLoading(false);
        return;
      }

      toast.success(TOAST_MESSAGES.otpSent);
      setErrors({});
      setStep("otp");
    } catch {
      toast.error(ERROR_MESSAGES.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────
  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const otpValue = form.getValues("otp");

    if (!otpValue) newErrors.otp = ERROR_MESSAGES.otpRequired;
    else if (otpValue.length !== 6) newErrors.otp = ERROR_MESSAGES.otpLength;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.getValues("email"), otp: otpValue }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.message || ERROR_MESSAGES.otpInvalid;
        setErrors({ otp: errorMsg });
        setIsLoading(false);
        return;
      }

      toast.success(TOAST_MESSAGES.otpVerified);
      setErrors({});
      setStep("reset");
    } catch {
      setErrors({ otp: ERROR_MESSAGES.genericError });
      toast.error(ERROR_MESSAGES.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3: Reset Password ────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const newPasswordValue = form.getValues("newPassword");
    const confirmPasswordValue = form.getValues("confirmPassword");

    if (!newPasswordValue) newErrors.newPassword = ERROR_MESSAGES.passwordRequired;
    else if (newPasswordValue.length < 6)
      newErrors.newPassword = ERROR_MESSAGES.passwordTooShort;

    if (!confirmPasswordValue) newErrors.confirmPassword = ERROR_MESSAGES.confirmRequired;
    else if (newPasswordValue !== confirmPasswordValue)
      newErrors.confirmPassword = ERROR_MESSAGES.passwordMismatch;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.getValues("email"),
          otp: form.getValues("otp"),
          newPassword: newPasswordValue,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.message || ERROR_MESSAGES.resetFailed;
        setErrors({ form: errorMsg });
        setIsLoading(false);
        return;
      }

      toast.success(TOAST_MESSAGES.passwordReset);
      setStep("success");
    } catch {
      setErrors({ form: ERROR_MESSAGES.genericError });
      toast.error(ERROR_MESSAGES.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles: Record<Step, string> = {
    email: "Forgot Password",
    otp: "Enter OTP",
    reset: "Set New Password",
    success: "Password Reset!",
  };

  const stepDescriptions: Record<Step, string> = {
    email: "Enter your registered email to receive a one-time password.",
    otp: `Enter the 6-digit OTP sent to ${form.watch("email")}`,
    reset: "Choose a new password for your account.",
    success: "Your password has been reset successfully.",
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[55%_45%]">
      {/* Left Side - Image */}
      <div className="hidden lg:flex relative bg-linear-to-br from-sky-600 via-cyan-500 to-blue-500 overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/login.png"
            alt="TripYojana - Travel Planning"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-br from-sky-600/40 via-cyan-500/40 to-blue-500/40" />
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-end p-10 pb-16">
          <div className="w-full max-w-2xl">
            <h1 className="text-5xl lg:text-6xl font-bold mb-3 text-white drop-shadow-lg">
              TripYojana
            </h1>
            <p className="text-base lg:text-lg text-white font-medium drop-shadow-md">
              Plan your perfect journey with ease. Manage trips, budgets, and itineraries all in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center bg-[#F5F5F5] dark:bg-zinc-950 p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="relative w-48 h-16 mx-auto mb-3">
              <Image
                src="/brand_logo.png"
                alt="TripYojana"
                fill
                className="object-contain"
                priority
              />
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Travel Planning Made Easy</p>
          </div>

          {/* Step indicator — hidden on success */}
          {step !== "success" && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {(["email", "otp", "reset"] as Step[]).map((s, index) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step === s
                      ? "bg-cyan-600 text-white scale-110"
                      : index < ["email", "otp", "reset"].indexOf(step)
                      ? "bg-cyan-200 dark:bg-cyan-800 text-cyan-700 dark:text-cyan-300"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                  }`}
                >
                  {index + 1}
                </div>
                {index < 2 && (
                  <div
                    className={`w-8 h-0.5 transition-all duration-300 ${
                      index < ["email", "otp", "reset"].indexOf(step)
                        ? "bg-cyan-400"
                        : "bg-zinc-200 dark:bg-zinc-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          )}

          <Form {...form}>
          <Card className="border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 rounded-2xl animate-fade-in-up animation-delay-200">
            <CardHeader className="space-y-2 pb-4 px-8 pt-8">
              <CardTitle className="text-2xl font-bold text-center text-zinc-900 dark:text-white">
                {stepTitles[step]}
              </CardTitle>
              <p className="text-sm text-center text-zinc-500 dark:text-zinc-400">
                {stepDescriptions[step]}
              </p>
            </CardHeader>

            {/* Step 1: Email */}
            {step === "email" && (
              <form onSubmit={handleSendOTP}>
                <CardContent className="px-8">
                  <FormPageViewSingleInputLayout height="h-fit">
                    <div className="space-y-2">
                      <InputFieldControlled
                        control={form.control}
                        name="email"
                        label={LABELS.email}
                        placeholder={PLACEHOLDERS.email}
                        type="email"
                        disabled={isLoading}
                        className={inputBaseClassName}
                        onChange={() => {
                          if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                        }}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-600 dark:text-red-400">{errors.email}</p>
                      )}
                    </div>
                  </FormPageViewSingleInputLayout>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 px-8 pb-8 pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg uppercase tracking-wide hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {isLoading ? BUTTON_LABELS.sendingOtp : BUTTON_LABELS.sendOtp}
                  </Button>
                  <button
                    type="button"
                    onClick={() => router.push("/auth?mode=login")}
                    className="text-sm text-cyan-600 dark:text-cyan-500 hover:underline underline-offset-2 font-semibold"
                  >
                    {BUTTON_LABELS.backToLogin}
                  </button>
                </CardFooter>
              </form>
            )}

            {/* Step 2: OTP */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOTP}>
                <CardContent className="px-8">
                  <FormPageViewSingleInputLayout height="h-fit">
                    <div className="space-y-2">
                      <InputFieldControlled
                        control={form.control}
                        name="otp"
                        label={LABELS.otp}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder={PLACEHOLDERS.otp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          form.setValue("otp", val, { shouldDirty: true, shouldValidate: true });
                          if (errors.otp) setErrors((p) => ({ ...p, otp: "" }));
                        }}
                        disabled={isLoading}
                        className={`${inputBaseClassName} text-center text-2xl tracking-widest`}
                      />
                      {errors.otp && (
                        <p className="text-xs text-red-600 dark:text-red-400">{errors.otp}</p>
                      )}
                    </div>
                  </FormPageViewSingleInputLayout>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 px-8 pb-8 pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg uppercase tracking-wide hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {isLoading ? BUTTON_LABELS.verifying : BUTTON_LABELS.verifyOtp}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      form.setValue("otp", "");
                      setErrors({});
                    }}
                    className="text-sm text-cyan-600 dark:text-cyan-500 hover:underline underline-offset-2 font-semibold"
                  >
                    {BUTTON_LABELS.resendOtp}
                  </button>
                </CardFooter>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === "reset" && (
              <form onSubmit={handleResetPassword}>
                <CardContent className="px-8">
                  {errors.form && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-3 dark:border-red-800 dark:bg-red-950/30">
                      <span className="mt-0.5 text-red-500">⚠</span>
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">{errors.form}</p>
                    </div>
                  )}
                  <FormPageViewSingleInputLayout height="h-fit">
                    <div className="space-y-2">
                      <InputFieldControlled
                        control={form.control}
                        name="newPassword"
                        label={LABELS.newPassword}
                        type={showPassword ? "text" : "password"}
                        placeholder={PLACEHOLDERS.password}
                        disabled={isLoading}
                        className={inputBaseClassName}
                        onChange={() => {
                          if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: "" }));
                        }}
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
                      {errors.newPassword && (
                        <p className="text-xs text-red-600 dark:text-red-400">{errors.newPassword}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <InputFieldControlled
                        control={form.control}
                        name="confirmPassword"
                        label={LABELS.confirmPassword}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={PLACEHOLDERS.password}
                        disabled={isLoading}
                        className={inputBaseClassName}
                        onChange={() => {
                          if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "" }));
                        }}
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
                        <p className="text-xs text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </FormPageViewSingleInputLayout>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 px-8 pb-8 pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg uppercase tracking-wide hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {isLoading ? BUTTON_LABELS.resetting : BUTTON_LABELS.resetPassword}
                  </Button>
                </CardFooter>
              </form>
            )}
            {/* Step 4: Success */}
            {step === "success" && (
              <CardContent className="flex flex-col items-center space-y-6 px-8 pb-8 pt-4">
                {/* Logo */}
                <div className="relative w-48 h-16">
                  <Image
                    src="/brand_logo.png"
                    alt="TripYojana"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>

                {/* Green checkmark */}
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Welcome back!</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Your password has been reset. You can now sign in with your new password.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => router.push("/auth?mode=login")}
                  className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg uppercase tracking-wide hover:scale-[1.01] active:scale-[0.99]"
                >
                  {BUTTON_LABELS.backToLogin}
                </Button>
              </CardContent>
            )}
          </Card>
          </Form>
        </div>
      </div>
    </div>
  );
}
