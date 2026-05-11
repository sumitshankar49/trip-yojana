"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/packages/components/ui/card";
import { Button } from "@/packages/components/ui/button";
import { Label } from "@/packages/components/ui/label";
import { Input } from "@/packages/components/ui/input";
import { Calendar } from "@/packages/components/ui/calendar";
import Navbar from "@/packages/components/shared/Navbar";
import { Popover, PopoverContent, PopoverTrigger } from "@/packages/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/packages/components/ui/tabs";
import { cn } from "@/packages/lib/utils";
import { toast } from "@/packages/lib/toast";
import ProtectedRoute from "@/packages/components/auth/ProtectedRoute";
import { TRIP_LABELS, TRIP_MESSAGES, TRIP_ERRORS } from "./constants";
import { InputFieldControlled } from "@/packages/components/shared/form/InputFieldControlled";
import { Form } from "@/packages/components/ui/form";
import { FormPageViewTwoInputLayout } from "@/packages/components/shared/form/FormPageViewTwoInputLayout";
import { Info, MapPin, Navigation } from "lucide-react";
import { fetchPincodeLocation } from "@/packages/lib/pincode";

type Step = 1 | 2 | 3;

type GuideItem = {
  id: string;
  name: string;
  category: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  address: string;
  imageUrl: string | null;
  mapUrl: string;
  source: "geoapify" | "overpass" | "wikipedia";
};

type DestinationGuide = {
  destination: {
    city: string;
    state: string;
    country: string;
    lat: number;
    lng: number;
  };
  overview: string;
  heroImageUrl: string | null;
  places: GuideItem[];
  shopping: GuideItem[];
  tips: string[];
  famousPlaces: string[];
  famousFoods: string[];
  popularFoodSpots: string[];
  shoppingHighlights: string[];
};

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
  const [budget, setBudget] = useState<number | "">("");
  const [travelType, setTravelType] = useState<string>("");
  const [sourceLocation, setSourceLocation] = useState({ district: "", state: "", region: "", country: "", loading: false, error: "" });
  const [destinationLocation, setDestinationLocation] = useState({ district: "", state: "", region: "", country: "", loading: false, error: "" });
  const [destinationGuide, setDestinationGuide] = useState<DestinationGuide | null>(null);
  const [isGuideLoading, setIsGuideLoading] = useState(false);
  const [guideError, setGuideError] = useState("");
  const [activeGuideTab, setActiveGuideTab] = useState<"places" | "food" | "shopping">("places");
  const [addedGuidePlaces, setAddedGuidePlaces] = useState<string[]>([]);
  const [dateErrors, setDateErrors] = useState<{ startDate?: string; endDate?: string; travelType?: string }>({});
  
  // React Hook Form for source and destination
  const form = useForm<{
    source: string;
    sourcePincode: string;
    destination: string;
    destinationPincode: string;
  }>({
    defaultValues: {
      source: "",
      sourcePincode: "",
      destination: "",
      destinationPincode: "",
    },
  });
  const { control, handleSubmit: handleFormSubmit, watch, setValue } = form;

  const normalizeDate = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };
  
  const source = watch("source");
  const sourcePincode = watch("sourcePincode");
  const destination = watch("destination");
  const destinationPincode = watch("destinationPincode");

  const isValidPincode = (value: string) => /^\d{6}$/.test(value.trim());
  const guideLookupTarget = destination.trim() || destinationPincode.trim();
  const shouldShowGuide = destination.trim().length > 0 || isValidPincode(destinationPincode);

  const isStepOneReady =
    source.trim().length > 0 &&
    isValidPincode(sourcePincode) &&
    Boolean(sourceLocation.state && sourceLocation.country) &&
    destination.trim().length > 0 &&
    isValidPincode(destinationPincode) &&
    Boolean(destinationLocation.state && destinationLocation.country) &&
    !sourceLocation.loading &&
    !destinationLocation.loading &&
    source.trim().toLowerCase() !== destination.trim().toLowerCase();
  const isStepTwoReady = Boolean(
    startDate && endDate && normalizeDate(endDate).getTime() >= normalizeDate(startDate).getTime()
  );
  const isStepThreeReady = Boolean(travelType) && budget !== "" && Number(budget) >= 0;
  const isPrimaryActionDisabled =
    isSubmitting ||
    (currentStep === 1
      ? !isStepOneReady
      : currentStep === 2
      ? !isStepTwoReady
      : !isStepThreeReady);

  const totalDays =
    startDate && endDate
      ? Math.floor(
          (normalizeDate(endDate).getTime() -
            normalizeDate(startDate).getTime()) /
            86400000
        ) + 1
      : 0;

  useEffect(() => {
    const trimmedDestination = destination.trim();
    const trimmedDestinationPincode = destinationPincode.trim();
    const destinationQuery = trimmedDestination || trimmedDestinationPincode;
    setAddedGuidePlaces([]);
    setActiveGuideTab("places");

    if (!destinationQuery || (!isValidPincode(trimmedDestinationPincode) && destinationQuery.length < 3)) {
      setDestinationGuide(null);
      setGuideError("");
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsGuideLoading(true);
      setGuideError("");

      try {
        const params = new URLSearchParams({
          destination: destinationQuery,
          days: "3",
        });

        if (isValidPincode(trimmedDestinationPincode)) {
          params.set("pincode", trimmedDestinationPincode);
        }

        const response = await fetch(`/api/destination-guide?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          setDestinationGuide(null);
          setGuideError(data?.error || "Could not load destination suggestions");
          return;
        }

        setDestinationGuide(data as DestinationGuide);
      } catch (error) {
        if (!cancelled) {
          console.error("Destination guide fetch error:", error);
          setDestinationGuide(null);
          setGuideError("Could not load destination suggestions");
        }
      } finally {
        if (!cancelled) {
          setIsGuideLoading(false);
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [destination, destinationPincode]);

  const openGuideItemOnMap = (item: GuideItem) => {
    window.open(item.mapUrl, "_blank", "noopener,noreferrer");
  };

  const addGuideItemToItinerary = (item: GuideItem) => {
    setAddedGuidePlaces((previous) => {
      if (previous.includes(item.name)) {
        toast.info(`${item.name} is already added.`);
        return previous;
      }

      toast.success(`${item.name} added to itinerary list.`);
      return [...previous, item.name];
    });
  };

  const formatDistance = (distanceKm: number | null) => {
    if (distanceKm === null) return "Distance unavailable";
    return `${distanceKm.toFixed(1)} km away`;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return TRIP_LABELS.PICK_A_DATE;
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric" 
    });
  };

  const validateStep = (
    step: Step,
    formData?: {
      source: string;
      sourcePincode: string;
      destination: string;
      destinationPincode: string;
    }
  ): boolean => {
    if (step === 1) {
      // Validation for step 1 is handled by react-hook-form
      if (!formData) return false;
      
      if (!formData.source.trim()) return false;
      if (!formData.destination.trim()) return false;
      if (formData.source.trim().toLowerCase() === formData.destination.trim().toLowerCase()) {
        toast.error(TRIP_ERRORS.DESTINATION_SAME);
        return false;
      }
      if (!isValidPincode(formData.sourcePincode)) {
        toast.error("Source pincode must be exactly 6 digits");
        return false;
      }
        if (!sourceLocation.state || !sourceLocation.country) {
          toast.error(sourceLocation.error || "Resolve the source pincode before continuing");
          return false;
        }
        if (!isValidPincode(formData.destinationPincode)) {
          toast.error("Destination pincode must be exactly 6 digits");
          return false;
        }
        if (!destinationLocation.state || !destinationLocation.country) {
          toast.error(destinationLocation.error || "Resolve the destination pincode before continuing");
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

  useEffect(() => {
    let cancelled = false;

    const lookupSource = async () => {
      const pincode = sourcePincode.trim();
      if (!isValidPincode(pincode)) {
        setSourceLocation({ district: "", state: "", region: "", country: "", loading: false, error: pincode ? "Source pincode must be exactly 6 digits" : "" });
        return;
      }

      setSourceLocation((previous) => ({ ...previous, loading: true, error: "" }));
      const location = await fetchPincodeLocation(pincode);
      if (cancelled) return;

      setSourceLocation({
        district: location?.district || "",
        state: location?.state || "",
        region: location?.region || "",
        country: location?.country || "",
        loading: false,
        error: location ? "" : "Could not resolve source pincode",
      });
    };

    void lookupSource();

    return () => {
      cancelled = true;
    };
  }, [sourcePincode]);

  useEffect(() => {
    let cancelled = false;

    const lookupDestination = async () => {
      const pincode = destinationPincode.trim();
      if (!isValidPincode(pincode)) {
        setDestinationLocation({ district: "", state: "", region: "", country: "", loading: false, error: pincode ? "Destination pincode must be exactly 6 digits" : "" });
        return;
      }

      setDestinationLocation((previous) => ({ ...previous, loading: true, error: "" }));
      const location = await fetchPincodeLocation(pincode);
      if (cancelled) return;

      setDestinationLocation({
        district: location?.district || "",
        state: location?.state || "",
        region: location?.region || "",
        country: location?.country || "",
        loading: false,
        error: location ? "" : "Could not resolve destination pincode",
      });
    };

    void lookupDestination();

    return () => {
      cancelled = true;
    };
  }, [destinationPincode]);

  const submitTrip = async (formData: {
    source: string;
    sourcePincode: string;
    destination: string;
    destinationPincode: string;
  }) => {
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
          sourcePincode: formData.sourcePincode.trim(),
          destination: formData.destination.trim(),
          destinationPincode: formData.destinationPincode.trim(),
          budget: Number(budget) || 0,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          travelType: travelType || "leisure",
          places: [
            `${formData.source.trim()} ${formData.sourcePincode.trim()}`,
            `${formData.destination.trim()} ${formData.destinationPincode.trim()}`,
            ...addedGuidePlaces,
          ],
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        toast.error(data?.message || "Session expired. Please log in again.");
        setTimeout(() => router.push("/auth"), 1500);
        return;
      }

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
              <div className="space-y-5">
                <FormPageViewTwoInputLayout height="h-auto">
                  <div className="space-y-4 rounded-2xl border border-sky-200/60 bg-sky-50/40 p-4 dark:border-sky-900/40 dark:bg-sky-950/20">
                    <div>
                      <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">Source Location</p>
                      <p className="text-xs text-sky-700/80 dark:text-sky-300/80">Enter the starting city and its pincode.</p>
                    </div>

                    <InputFieldControlled
                      control={control}
                      name="source"
                      label={TRIP_LABELS.SOURCE_LABEL}
                      placeholder={TRIP_LABELS.SOURCE_PLACEHOLDER}
                      description={TRIP_LABELS.SOURCE_HINT}
                      icon={<Navigation className="h-4 w-4" />}
                      className="h-11"
                      required
                      type="text"
                    />

                    <InputFieldControlled
                      control={control}
                      name="sourcePincode"
                      label="Source Pincode"
                      placeholder="Ex: 800001"
                      description="6-digit pincode"
                      className="h-11"
                      required
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      onChange={(event) => {
                        const sanitized = event.target.value.replace(/\D/g, "").slice(0, 6);
                        setValue("sourcePincode", sanitized, { shouldValidate: true });
                      }}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>District *</Label>
                        <Input value={sourceLocation.loading ? "Resolving..." : sourceLocation.district || ""} readOnly required aria-required="true" className="h-11 bg-white/70 dark:bg-zinc-900/70" />
                      </div>
                      <div className="space-y-2">
                        <Label>State *</Label>
                        <Input value={sourceLocation.loading ? "Resolving..." : sourceLocation.state || ""} readOnly required aria-required="true" className="h-11 bg-white/70 dark:bg-zinc-900/70" />
                      </div>
                      <div className="space-y-2">
                        <Label>Region *</Label>
                        <Input value={sourceLocation.loading ? "Resolving..." : sourceLocation.region || ""} readOnly required aria-required="true" className="h-11 bg-white/70 dark:bg-zinc-900/70" />
                      </div>
                      <div className="space-y-2">
                        <Label>Country *</Label>
                        <Input value={sourceLocation.loading ? "Resolving..." : sourceLocation.country || ""} readOnly required aria-required="true" className="h-11 bg-white/70 dark:bg-zinc-900/70" />
                      </div>
                    </div>

                    {sourceLocation.error ? <p className="text-xs text-destructive">{sourceLocation.error}</p> : null}
                  </div>

                  <div className="space-y-4 rounded-2xl border border-cyan-200/60 bg-cyan-50/40 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                    <div>
                      <p className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">Destination Location</p>
                      <p className="text-xs text-cyan-700/80 dark:text-cyan-300/80">Enter the destination city and its pincode.</p>
                    </div>

                    <InputFieldControlled
                      control={control}
                      name="destination"
                      label={TRIP_LABELS.DESTINATION_LABEL}
                      placeholder={TRIP_LABELS.DESTINATION_PLACEHOLDER}
                      description={TRIP_LABELS.DESTINATION_HINT}
                      icon={<MapPin className="h-4 w-4" />}
                      className="h-11"
                      required
                      type="text"
                    />

                    <InputFieldControlled
                      control={control}
                      name="destinationPincode"
                      label="Destination Pincode"
                      placeholder="Ex: 281001"
                      description="6-digit pincode"
                      className="h-11"
                      required
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      onChange={(event) => {
                        const sanitized = event.target.value.replace(/\D/g, "").slice(0, 6);
                        setValue("destinationPincode", sanitized, { shouldValidate: true });
                      }}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>District *</Label>
                        <Input value={destinationLocation.loading ? "Resolving..." : destinationLocation.district || ""} readOnly required aria-required="true" className="h-11 bg-white/70 dark:bg-zinc-900/70" />
                      </div>
                      <div className="space-y-2">
                        <Label>State *</Label>
                        <Input value={destinationLocation.loading ? "Resolving..." : destinationLocation.state || ""} readOnly required aria-required="true" className="h-11 bg-white/70 dark:bg-zinc-900/70" />
                      </div>
                      <div className="space-y-2">
                        <Label>Region *</Label>
                        <Input value={destinationLocation.loading ? "Resolving..." : destinationLocation.region || ""} readOnly required aria-required="true" className="h-11 bg-white/70 dark:bg-zinc-900/70" />
                      </div>
                      <div className="space-y-2">
                        <Label>Country *</Label>
                        <Input value={destinationLocation.loading ? "Resolving..." : destinationLocation.country || ""} readOnly required aria-required="true" className="h-11 bg-white/70 dark:bg-zinc-900/70" />
                      </div>
                    </div>

                    {destinationLocation.error ? <p className="text-xs text-destructive">{destinationLocation.error}</p> : null}
                  </div>
                </FormPageViewTwoInputLayout>

                {shouldShowGuide && (
                  <div className="rounded-2xl border border-sky-200/70 bg-linear-to-br from-sky-50 via-cyan-50 to-emerald-50 p-4 shadow-sm transition-all duration-300 dark:border-sky-900/40 dark:from-sky-950/30 dark:via-cyan-950/20 dark:to-emerald-950/20">
                    <div className="relative overflow-hidden rounded-2xl border border-sky-200/70 bg-white/90 p-4 shadow-sm dark:border-sky-900/40 dark:bg-zinc-900/70">
                      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-700/30" />
                      <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-700/20" />

                      <div className="relative flex items-start gap-3">
                        <div className="rounded-full bg-sky-100 p-2 text-sky-700 ring-4 ring-sky-100/70 dark:bg-sky-900/40 dark:text-sky-300 dark:ring-sky-950/30">
                          <Info className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                              Discover {destinationGuide?.destination.city || guideLookupTarget}
                            </p>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                              SMART CITY GUIDE
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-300">
                            {destinationGuide
                              ? `${destinationGuide.destination.city}, ${destinationGuide.destination.state} • places, food, shopping`
                              : "Fetching city discovery insights..."}
                          </p>
                        </div>
                      </div>

                      {destinationGuide?.heroImageUrl ? (
                        <div className="relative mt-4 h-36 overflow-hidden rounded-xl border border-sky-200/70 dark:border-sky-900/40">
                          <Image
                            src={destinationGuide.heroImageUrl}
                            alt={`${destinationGuide.destination.city} hero`}
                            width={1200}
                            height={360}
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 text-xs text-white">
                            {destinationGuide.overview || "City overview unavailable right now."}
                          </div>
                        </div>
                      ) : destinationGuide?.overview ? (
                        <div className="mt-4 rounded-xl border border-sky-200/70 bg-sky-50/70 p-3 text-xs leading-5 text-zinc-700 dark:border-sky-900/40 dark:bg-zinc-900/60 dark:text-zinc-300">
                          {destinationGuide.overview}
                        </div>
                      ) : null}
                    </div>

                    {isGuideLoading && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((key) => (
                          <div key={key} className="rounded-xl border border-sky-200/70 bg-white/90 p-3 dark:border-sky-900/30 dark:bg-zinc-900/70">
                            <div className="mb-3 h-24 animate-pulse rounded-lg bg-zinc-200/70 dark:bg-zinc-800/70" />
                            <div className="mb-2 h-4 w-2/3 animate-pulse rounded bg-zinc-200/70 dark:bg-zinc-800/70" />
                            <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-200/70 dark:bg-zinc-800/70" />
                          </div>
                        ))}
                      </div>
                    )}

                    {guideError && (
                      <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                        {guideError}
                      </p>
                    )}

                    {!isGuideLoading && !guideError && destinationGuide && (
                      <div className="mt-4">
                        <Tabs value={activeGuideTab} onValueChange={(value) => setActiveGuideTab(value as "places" | "food" | "shopping")}>
                          <TabsList className="grid h-10 w-full grid-cols-3 rounded-2xl bg-sky-100/80 p-1 dark:bg-zinc-800">
                            <TabsTrigger value="places" className="rounded-xl text-xs">Places</TabsTrigger>
                            <TabsTrigger value="food" className="rounded-xl text-xs">Food</TabsTrigger>
                            <TabsTrigger value="shopping" className="rounded-xl text-xs">Shopping</TabsTrigger>
                          </TabsList>

                          <TabsContent value="places" className="mt-3">
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                              {destinationGuide.places.slice(0, 6).map((item) => (
                                <div key={item.id} className="rounded-xl border border-sky-200/70 bg-white/90 p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-sky-900/40 dark:bg-zinc-900/70">
                                  <div className="mb-3 h-28 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    {item.imageUrl ? (
                                      <Image src={item.imageUrl} alt={item.name} width={480} height={224} unoptimized className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-sky-100 to-cyan-100 text-xs font-semibold text-sky-700 dark:from-sky-950/40 dark:to-cyan-950/30 dark:text-sky-300">
                                        {item.category}
                                      </div>
                                    )}
                                  </div>
                                  <p className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p>
                                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{formatDistance(item.distanceKm)}</p>
                                  <div className="mt-3 flex gap-2">
                                    <Button type="button" variant="outline" size="sm" className="h-8 flex-1 text-xs" onClick={() => openGuideItemOnMap(item)}>
                                      Open Map
                                    </Button>
                                    <Button type="button" size="sm" className="h-8 flex-1 bg-sky-600 text-xs text-white hover:bg-sky-700" onClick={() => addGuideItemToItinerary(item)}>
                                      {addedGuidePlaces.includes(item.name) ? "Added" : "Add to Itinerary"}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {destinationGuide.places.length === 0 && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">No place data found for this city yet.</p>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="food" className="mt-3">
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                              {destinationGuide.famousFoods.slice(0, 9).map((food) => (
                                <div key={food} className="rounded-xl border border-emerald-200/70 bg-white/90 p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-emerald-900/40 dark:bg-zinc-900/70">
                                  <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-linear-to-br from-emerald-100 to-lime-100 text-xs font-semibold text-emerald-700 dark:from-emerald-950/40 dark:to-lime-950/30 dark:text-emerald-300">
                                    Signature Dish
                                  </div>
                                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{food}</p>
                                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">State-based famous food</p>
                                </div>
                              ))}
                              {destinationGuide.famousFoods.length === 0 && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">No state food data found yet.</p>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="shopping" className="mt-3">
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                              {destinationGuide.shopping.slice(0, 6).map((item) => (
                                <div key={item.id} className="rounded-xl border border-amber-200/70 bg-white/90 p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-amber-900/40 dark:bg-zinc-900/70">
                                  <div className="mb-3 h-28 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    {item.imageUrl ? (
                                      <Image src={item.imageUrl} alt={item.name} width={480} height={224} unoptimized className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-amber-100 to-orange-100 text-xs font-semibold text-amber-700 dark:from-amber-950/40 dark:to-orange-950/30 dark:text-amber-300">
                                        Shopping
                                      </div>
                                    )}
                                  </div>
                                  <p className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p>
                                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{formatDistance(item.distanceKm)}</p>
                                  <div className="mt-3 flex gap-2">
                                    <Button type="button" variant="outline" size="sm" className="h-8 flex-1 text-xs" onClick={() => openGuideItemOnMap(item)}>
                                      Open Map
                                    </Button>
                                    <Button type="button" size="sm" className="h-8 flex-1 bg-amber-600 text-xs text-white hover:bg-amber-700" onClick={() => addGuideItemToItinerary(item)}>
                                      {addedGuidePlaces.includes(item.name) ? "Added" : "Add to Itinerary"}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {destinationGuide.shopping.length === 0 && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">No shopping data found for this city yet.</p>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>

                        <div className="mt-3 rounded-2xl border border-sky-200/80 bg-white/85 px-4 py-3 text-xs text-zinc-700 shadow-sm dark:border-sky-900/40 dark:bg-zinc-900/60 dark:text-zinc-300">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Travel tips:</span>{" "}
                          {destinationGuide.tips.length ? destinationGuide.tips.join(" ") : "Use this guide as a quick overview and adapt it to your schedule."}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {TRIP_LABELS.BUDGET_LABEL} <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-500">₹</span>
                      <Input
                        id="budget"
                        type="number"
                        min={0}
                        step={100}
                        placeholder="e.g. 25000"
                        value={budget}
                        onChange={(event) => {
                          const value = event.target.value;
                          setBudget(value === "" ? "" : Number(value));
                        }}
                        className="h-11 pl-7"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="travelType" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {TRIP_LABELS.TRAVEL_TYPE_LABEL} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="travelType"
                      value={travelType}
                      onChange={(event) => {
                        setTravelType(event.target.value);
                        if (dateErrors.travelType) {
                          setDateErrors((prev) => ({ ...prev, travelType: undefined }));
                        }
                      }}
                      placeholder={TRIP_LABELS.TRAVEL_TYPE_PLACEHOLDER}
                      className="h-11"
                      aria-invalid={!!dateErrors.travelType}
                    />
                    {dateErrors.travelType && (
                      <p className="text-sm text-destructive">{dateErrors.travelType}</p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Enter details in the same format used in edit trip.
                </p>

                {/* Summary */}
                <div className="mt-6 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 space-y-2">
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                    {TRIP_LABELS.TRIP_SUMMARY_TITLE}
                  </h4>
                  <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <p>
                      <span className="font-medium">{TRIP_LABELS.SUMMARY_FROM}</span>{" "}
                      {source || TRIP_LABELS.NOT_SET}
                      {sourcePincode ? ` (${sourcePincode})` : ""}
                    </p>
                    <p>
                      <span className="font-medium">{TRIP_LABELS.SUMMARY_TO}</span>{" "}
                      {destination || TRIP_LABELS.NOT_SET}
                      {destinationPincode ? ` (${destinationPincode})` : ""}
                    </p>
                    <p>
                      <span className="font-medium">Dates:</span>{" "}
                      {startDate && endDate
                        ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                        : "Not set"}
                    </p>
                    <p><span className="font-medium">{TRIP_LABELS.SUMMARY_BUDGET}</span> ₹{budget !== "" ? Number(budget).toLocaleString("en-IN") : "Not set"}</p>
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
            <Button
              onClick={handleNext}
              disabled={isPrimaryActionDisabled}
              className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white"
            >
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
