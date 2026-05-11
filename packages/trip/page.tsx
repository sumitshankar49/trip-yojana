"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/packages/components/ui/card";
import { Button } from "@/packages/components/ui/button";
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
import { InputFieldControlled } from "@/packages/components/shared/form/InputFieldControlled";
import { Form } from "@/packages/components/ui/form";
import { FormPageViewTwoInputLayout } from "@/packages/components/shared/form/FormPageViewTwoInputLayout";
import { MapPin, Navigation } from "lucide-react";

type Step = 1 | 2 | 3;

const stepMeta: { step: Step; label: string; hint: string }[] = [
  { step: 1, label: TRIP_LABELS.STEP_1_LABEL, hint: TRIP_LABELS.STEP_1_HINT },
  { step: 2, label: TRIP_LABELS.STEP_2_LABEL, hint: TRIP_LABELS.STEP_2_HINT },
  { step: 3, label: TRIP_LABELS.STEP_3_LABEL, hint: TRIP_LABELS.STEP_3_HINT },
];

export default function CreateTripPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const progressPercent = (currentStep / 3) * 100;
  
  // Form state for dates, budget, and travel type (not using react-hook-form for these)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [budget, setBudget] = useState<number>(2000);
  const [travelType, setTravelType] = useState<string>("");
  const [dateErrors, setDateErrors] = useState<{ startDate?: string; endDate?: string; travelType?: string }>({});
  
  // React Hook Form for source and destination
  const form = useForm<{ source: string; destination: string }>({
    defaultValues: {
      source: "",
      destination: "",
    },
  });
  const { control, handleSubmit: handleFormSubmit, watch } = form;
  
  const source = watch("source");
  const destination = watch("destination");

  const normalizeDate = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const totalDays =
    startDate && endDate
      ? Math.floor(
          (normalizeDate(endDate).getTime() -
            normalizeDate(startDate).getTime()) /
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

  const validateStep = (step: Step, formData?: { source: string; destination: string }): boolean => {
    if (step === 1) {
      // Validation for step 1 is handled by react-hook-form
      if (!formData) return false;
      
      if (!formData.source.trim()) return false;
      if (!formData.destination.trim()) return false;
      if (formData.source.trim().toLowerCase() === formData.destination.trim().toLowerCase()) {
        toast.error(TRIP_ERRORS.DESTINATION_SAME);
        return false;
      }
      return true;
    } else if (step === 2) {
      const newErrors: { startDate?: string; endDate?: string } = {};
      
      if (!startDate) {
        newErrors.startDate = TRIP_ERRORS.START_DATE_REQUIRED;
      }
      if (!endDate) {
        newErrors.endDate = TRIP_ERRORS.END_DATE_REQUIRED;
      }
      if (startDate && endDate && startDate > endDate) {
        newErrors.endDate = TRIP_ERRORS.END_DATE_BEFORE_START;
      }
      
      setDateErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } else if (step === 3) {
      const newErrors: { travelType?: string } = {};
      
      if (!travelType) {
        newErrors.travelType = TRIP_ERRORS.TRAVEL_TYPE_REQUIRED;
      }
      
      setDateErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    
    return true;
  };

  const handleNext = handleFormSubmit((formData) => {
    if (currentStep === 1) {
      if (validateStep(1, formData)) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep(2)) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      if (validateStep(3)) {
        submitTrip(formData);
      }
    }
  });

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      setDateErrors({});
    }
  };

  const submitTrip = async (formData: { source: string; destination: string }) => {
    if (!startDate || !endDate) {
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
          source: formData.source.trim(),
          destination: formData.destination.trim(),
          budget: budget,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          travelType: travelType || "leisure",
          places: [formData.source.trim(), formData.destination.trim()],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.message || TRIP_MESSAGES.CREATE_FAILED);
        return;
      }

      toast.success(TRIP_MESSAGES.TRIP_CREATED);
      
      // Redirect to dashboard after 1 second
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Create trip error:", error);
      toast.error(TRIP_MESSAGES.GENERIC_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    if (date && endDate) {
      const selectedStart = normalizeDate(date);
      const selectedEnd = normalizeDate(endDate);
      if (selectedEnd < selectedStart) {
        setEndDate(undefined);
      }
    }
    if (dateErrors.startDate) {
      setDateErrors((prev) => ({ ...prev, startDate: undefined }));
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    if (dateErrors.endDate) {
      setDateErrors((prev) => ({ ...prev, endDate: undefined }));
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

            <Form {...form}>
            <CardContent className="space-y-6 pt-6">
            {/* Step 1: Location */}
            {currentStep === 1 && (
              <FormPageViewTwoInputLayout isWithStepper>
                <InputFieldControlled
                  control={control}
                  name="source"
                  label={TRIP_LABELS.SOURCE_LABEL}
                  placeholder={TRIP_LABELS.SOURCE_PLACEHOLDER}
                  description={TRIP_LABELS.SOURCE_HINT}
                  icon={<Navigation className="h-4 w-4" />}
                  required
                  type="text"
                />

                <InputFieldControlled
                  control={control}
                  name="destination"
                  label={TRIP_LABELS.DESTINATION_LABEL}
                  placeholder={TRIP_LABELS.DESTINATION_PLACEHOLDER}
                  description={TRIP_LABELS.DESTINATION_HINT}
                  icon={<MapPin className="h-4 w-4" />}
                  required
                  type="text"
                />
              </FormPageViewTwoInputLayout>
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
                          !startDate && "text-muted-foreground"
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
                        {formatDate(startDate)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={handleStartDateChange}
                        disabled={(date) => normalizeDate(date) < normalizeDate(new Date())}

                      />
                    </PopoverContent>
                  </Popover>
                  {dateErrors.startDate && (
                    <p className="text-sm text-destructive">{dateErrors.startDate}</p>
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
                          !endDate && "text-muted-foreground"
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
                        {formatDate(endDate)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={handleEndDateChange}
                        disabled={(date) => 
                          normalizeDate(date) < normalizeDate(new Date()) || 
                          (startDate
                            ? normalizeDate(date) < normalizeDate(startDate)
                            : false)
                        }

                      />
                    </PopoverContent>
                  </Popover>
                  {dateErrors.endDate && (
                    <p className="text-sm text-destructive">{dateErrors.endDate}</p>
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
                        ₹{budget.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <Slider
                      value={[budget]}
                      onValueChange={([value]) => setBudget(value)}
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
                    value={travelType}
                    onValueChange={(value) => {
                      setTravelType(value);
                      if (dateErrors.travelType) {
                        setDateErrors((prev) => ({ ...prev, travelType: undefined }));
                      }
                    }}
                  >
                    <SelectTrigger id="travelType" aria-invalid={!!dateErrors.travelType}>
                      <SelectValue placeholder={TRIP_LABELS.TRAVEL_TYPE_PLACEHOLDER} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">{TRIP_LABELS.SOLO}</SelectItem>
                      <SelectItem value="family">{TRIP_LABELS.FAMILY}</SelectItem>
                      <SelectItem value="friends">{TRIP_LABELS.FRIENDS}</SelectItem>
                    </SelectContent>
                  </Select>
                  {dateErrors.travelType && (
                    <p className="text-sm text-destructive">{dateErrors.travelType}</p>
                  )}
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 space-y-2">
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                    {TRIP_LABELS.TRIP_SUMMARY_TITLE}
                  </h4>
                  <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <p><span className="font-medium">{TRIP_LABELS.SUMMARY_FROM}</span> {source || TRIP_LABELS.NOT_SET}</p>
                    <p><span className="font-medium">{TRIP_LABELS.SUMMARY_TO}</span> {destination || TRIP_LABELS.NOT_SET}</p>
                    <p>
                      <span className="font-medium">Dates:</span>{" "}
                      {startDate && endDate
                        ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                        : "Not set"}
                    </p>
                    <p><span className="font-medium">{TRIP_LABELS.SUMMARY_BUDGET}</span> ₹{budget.toLocaleString("en-IN")}</p>
                    {totalDays > 0 && (
                      <p><span className="font-medium">Duration:</span> {totalDays} {totalDays === 1 ? "day" : "days"}</p>
                    )}
                    <p>
                      <span className="font-medium">Type:</span>{" "}
                      {travelType
                        ? travelType.charAt(0).toUpperCase() + travelType.slice(1)
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </>
            )}
            </CardContent>
            </Form>

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
