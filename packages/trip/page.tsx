"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/packages/components/ui/card";
import { Button } from "@/packages/components/ui/button";
import { Input } from "@/packages/components/ui/input";
import { Label } from "@/packages/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/packages/components/ui/select";
import { Slider } from "@/packages/components/ui/slider";
import { Calendar } from "@/packages/components/ui/calendar";
import Navbar from "@/packages/components/shared/Navbar";
import { Popover, PopoverContent, PopoverTrigger } from "@/packages/components/ui/popover";
import { cn } from "@/packages/lib/utils";
import { toast } from "sonner";
import ProtectedRoute from "@/packages/components/auth/ProtectedRoute";
import { TRIP_LABELS, TRIP_MESSAGES, TRIP_ERRORS } from "./constants";

interface TripFormData {
  source: string;
  destination: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  budget: number;
  travelType: string;
}

type Step = 1 | 2 | 3;

const stepMeta: { step: Step; label: string; hint: string }[] = [
  { step: 1, label: TRIP_LABELS.STEP_1_LABEL, hint: TRIP_LABELS.STEP_1_HINT },
  { step: 2, label: TRIP_LABELS.STEP_2_LABEL, hint: TRIP_LABELS.STEP_2_HINT },
  { step: 3, label: TRIP_LABELS.STEP_3_LABEL, hint: TRIP_LABELS.STEP_3_HINT },
];

export default function CreateTripPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<TripFormData>({
    source: "",
    destination: "",
    startDate: undefined,
    endDate: undefined,
    budget: 2000,
    travelType: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TripFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const progressPercent = (currentStep / 3) * 100;

  const normalizeDate = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const totalDays =
    formData.startDate && formData.endDate
      ? Math.floor(
          (normalizeDate(formData.endDate).getTime() -
            normalizeDate(formData.startDate).getTime()) /
            86400000
        ) + 1
      : 0;

  const formatDate = (date: Date | undefined) => {
    if (!date) return TRIP_LABELS.PICK_A_DATE;
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric" 
    });
  };

  const validateStep = (step: Step): boolean => {
    const newErrors: Partial<Record<keyof TripFormData, string>> = {};

    if (step === 1) {
      if (!formData.source.trim()) {
        newErrors.source = TRIP_ERRORS.SOURCE_REQUIRED;
      }
      if (!formData.destination.trim()) {
        newErrors.destination = TRIP_ERRORS.DESTINATION_REQUIRED;
      }
      if (
        formData.source.trim() &&
        formData.destination.trim() &&
        formData.source.trim().toLowerCase() === formData.destination.trim().toLowerCase()
      ) {
        newErrors.destination = TRIP_ERRORS.DESTINATION_SAME;
      }
    } else if (step === 2) {
      if (!formData.startDate) {
        newErrors.startDate = TRIP_ERRORS.START_DATE_REQUIRED;
      }
      if (!formData.endDate) {
        newErrors.endDate = TRIP_ERRORS.END_DATE_REQUIRED;
      }
      if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        newErrors.endDate = TRIP_ERRORS.END_DATE_BEFORE_START;
      }
    } else if (step === 3) {
      if (!formData.travelType) {
        newErrors.travelType = TRIP_ERRORS.TRAVEL_TYPE_REQUIRED;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep((prev) => (prev + 1) as Step);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    if (!formData.startDate || !formData.endDate) {
      toast.error(TRIP_MESSAGES.DATES_REQUIRED);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${formData.source.trim()} to ${formData.destination.trim()}`,
          budget: formData.budget,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate.toISOString(),
          places: [formData.destination.trim()],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.message || TRIP_MESSAGES.CREATE_FAILED);
        return;
      }

      toast.success(TRIP_MESSAGES.TRIP_CREATED);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Create trip error:", error);
      toast.error(TRIP_MESSAGES.GENERIC_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof TripFormData, value: string | number | Date | undefined) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "startDate" && value instanceof Date && prev.endDate) {
        const selectedStart = normalizeDate(value);
        const selectedEnd = normalizeDate(prev.endDate);
        if (selectedEnd < selectedStart) {
          next.endDate = undefined;
        }
      }

      return next;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.08),transparent_45%),linear-gradient(to_bottom,#f8fafc,#f1f5f9)] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_40%),linear-gradient(to_bottom,#09090b,#09090b)]">
        <Navbar />
        <div className="px-4 py-10 sm:px-6 lg:py-12">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold tracking-wide text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
              TRIP PLANNER WIZARD
            </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              {TRIP_LABELS.PAGE_TITLE}
            </h1>
            <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
              {TRIP_LABELS.PAGE_DESCRIPTION}
            </p>
          </div>

          <div className="mb-8 rounded-2xl border border-zinc-200/70 bg-white/80 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
            <div className="mb-3 flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>Progress</span>
              <span>Step {currentStep} of 3</span>
            </div>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-linear-to-r from-sky-500 to-cyan-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {stepMeta.map((item, index) => (
                <div key={item.step} className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all sm:h-10 sm:w-10",
                      currentStep >= item.step
                        ? "bg-sky-600 text-white"
                        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    {currentStep > item.step ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      item.step
                    )}
                  </div>

                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate text-xs font-semibold sm:text-sm",
                        currentStep >= item.step
                          ? "text-zinc-900 dark:text-zinc-50"
                          : "text-zinc-500 dark:text-zinc-400"
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400 sm:text-xs">
                      {item.hint}
                    </p>
                  </div>
                  {index < 2 && <div className="hidden" />}
                </div>
              ))}
            </div>
          </div>

          <Card className="border-zinc-200/70 bg-white/90 shadow-xl shadow-zinc-200/40 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85 dark:shadow-black/20">
            <CardHeader className="border-b border-zinc-100 pb-5 dark:border-zinc-800">
              <div className="mb-2 inline-flex w-fit items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {currentStep === 1 && TRIP_LABELS.STEP_1_BADGE}
                {currentStep === 2 && TRIP_LABELS.STEP_2_BADGE}
                {currentStep === 3 && TRIP_LABELS.STEP_3_BADGE}
              </div>
            <CardTitle>
              {currentStep === 1 && TRIP_LABELS.STEP_1_TITLE}
              {currentStep === 2 && TRIP_LABELS.STEP_2_TITLE}
              {currentStep === 3 && TRIP_LABELS.STEP_3_TITLE}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && TRIP_LABELS.STEP_1_DESC}
              {currentStep === 2 && TRIP_LABELS.STEP_2_DESC}
              {currentStep === 3 && TRIP_LABELS.STEP_3_DESC}
            </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
            {/* Step 1: Location */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="source">{TRIP_LABELS.SOURCE_LABEL}</Label>
                  <Input
                    id="source"
                    placeholder={TRIP_LABELS.SOURCE_PLACEHOLDER}
                    value={formData.source}
                    onChange={(e) => updateFormData("source", e.target.value)}
                    aria-invalid={!!errors.source}
                    className="h-11"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{TRIP_LABELS.SOURCE_HINT}</p>
                  {errors.source && (
                    <p className="text-sm text-destructive">{errors.source}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">{TRIP_LABELS.DESTINATION_LABEL}</Label>
                  <Input
                    id="destination"
                    placeholder={TRIP_LABELS.DESTINATION_PLACEHOLDER}
                    value={formData.destination}
                    onChange={(e) => updateFormData("destination", e.target.value)}
                    aria-invalid={!!errors.destination}
                    className="h-11"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{TRIP_LABELS.DESTINATION_HINT}</p>
                  {errors.destination && (
                    <p className="text-sm text-destructive">{errors.destination}</p>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Dates */}
            {currentStep === 2 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{TRIP_LABELS.START_DATE_LABEL}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2 h-4 w-4"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {formatDate(formData.startDate)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => updateFormData("startDate", date)}
                        disabled={(date) => normalizeDate(date) < normalizeDate(new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && (
                    <p className="text-sm text-destructive">{errors.startDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{TRIP_LABELS.END_DATE_LABEL}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground"
                        )}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2 h-4 w-4"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {formatDate(formData.endDate)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => updateFormData("endDate", date)}
                        disabled={(date) => 
                          normalizeDate(date) < normalizeDate(new Date()) || 
                          (formData.startDate
                            ? normalizeDate(date) < normalizeDate(formData.startDate)
                            : false)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && (
                    <p className="text-sm text-destructive">{errors.endDate}</p>
                  )}
                </div>

                {totalDays > 0 && (
                  <div className="md:col-span-2 rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-300">
                    Total trip duration: <span className="font-semibold">{totalDays} {totalDays === 1 ? "day" : "days"}</span>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Budget & Travel Type */}
            {currentStep === 3 && (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{TRIP_LABELS.BUDGET_LABEL}</Label>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        ₹{formData.budget.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <Slider
                      value={[formData.budget]}
                      onValueChange={([value]) => updateFormData("budget", value)}
                      min={5000}
                      max={500000}
                      step={1000}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                      <span>{TRIP_LABELS.BUDGET_MIN_LABEL}</span>
                      <span>{TRIP_LABELS.BUDGET_MAX_LABEL}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="travelType">{TRIP_LABELS.TRAVEL_TYPE_LABEL}</Label>
                  <Select
                    value={formData.travelType}
                    onValueChange={(value) => updateFormData("travelType", value)}
                  >
                    <SelectTrigger id="travelType" aria-invalid={!!errors.travelType}>
                      <SelectValue placeholder={TRIP_LABELS.TRAVEL_TYPE_PLACEHOLDER} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">{TRIP_LABELS.SOLO}</SelectItem>
                      <SelectItem value="family">{TRIP_LABELS.FAMILY}</SelectItem>
                      <SelectItem value="friends">{TRIP_LABELS.FRIENDS}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.travelType && (
                    <p className="text-sm text-destructive">{errors.travelType}</p>
                  )}
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 space-y-2">
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                    {TRIP_LABELS.TRIP_SUMMARY_TITLE}
                  </h4>
                  <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <p><span className="font-medium">{TRIP_LABELS.SUMMARY_FROM}</span> {formData.source || TRIP_LABELS.NOT_SET}</p>
                    <p><span className="font-medium">{TRIP_LABELS.SUMMARY_TO}</span> {formData.destination || TRIP_LABELS.NOT_SET}</p>
                    <p>
                      <span className="font-medium">Dates:</span>{" "}
                      {formData.startDate && formData.endDate
                        ? `${formatDate(formData.startDate)} - ${formatDate(formData.endDate)}`
                        : "Not set"}
                    </p>
                    <p><span className="font-medium">{TRIP_LABELS.SUMMARY_BUDGET}</span> ₹{formData.budget.toLocaleString("en-IN")}</p>
                    {totalDays > 0 && (
                      <p><span className="font-medium">Duration:</span> {totalDays} {totalDays === 1 ? "day" : "days"}</p>
                    )}
                    <p>
                      <span className="font-medium">Type:</span>{" "}
                      {formData.travelType
                        ? formData.travelType.charAt(0).toUpperCase() + formData.travelType.slice(1)
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </>
            )}
            </CardContent>

            <CardFooter className="flex flex-col-reverse gap-3 border-t border-zinc-100 pt-5 sm:flex-row sm:justify-between dark:border-zinc-800">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="w-full sm:w-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              {TRIP_LABELS.BACK_BUTTON}
            </Button>
            <Button onClick={handleNext} disabled={isSubmitting} className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white">
              {currentStep === 3 ? (
                <>
                  {isSubmitting ? TRIP_LABELS.CREATING_BUTTON : TRIP_LABELS.CREATE_TRIP_BUTTON}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-2 h-4 w-4"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </>
              ) : (
                <>
                  {TRIP_LABELS.NEXT_BUTTON}
                </>
              )}
            </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
