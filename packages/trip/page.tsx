"use client";

import { useState } from "react";
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

interface TripFormData {
  source: string;
  destination: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  budget: number;
  travelType: string;
}

type Step = 1 | 2 | 3;

export default function CreateTripPage() {
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

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Pick a date";
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
        newErrors.source = "Source is required";
      }
      if (!formData.destination.trim()) {
        newErrors.destination = "Destination is required";
      }
    } else if (step === 2) {
      if (!formData.startDate) {
        newErrors.startDate = "Start date is required";
      }
      if (!formData.endDate) {
        newErrors.endDate = "End date is required";
      }
      if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        newErrors.endDate = "End date must be after start date";
      }
    } else if (step === 3) {
      if (!formData.travelType) {
        newErrors.travelType = "Travel type is required";
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

  const handleSubmit = () => {
    console.log("Trip created:", formData);
    // Here you would typically send data to your backend
    alert("Trip created successfully!");
  };

  const updateFormData = (field: keyof TripFormData, value: string | number | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Create New Trip
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Plan your next adventure in a few simple steps
            </p>
          </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                      currentStep >= step
                        ? "bg-primary text-primary-foreground"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {currentStep > step ? (
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
                      step
                    )}
                  </div>
                  <div className="mt-2 text-xs font-medium text-center">
                    {step === 1 && "Location"}
                    {step === 2 && "Dates"}
                    {step === 3 && "Details"}
                  </div>
                </div>
                {index < 2 && (
                  <div
                    className={cn(
                      "h-1 flex-1 mx-2 rounded transition-all",
                      currentStep > step
                        ? "bg-primary"
                        : "bg-zinc-200 dark:bg-zinc-800"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Where are you traveling?"}
              {currentStep === 2 && "When is your trip?"}
              {currentStep === 3 && "Trip details"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Enter your departure and destination locations"}
              {currentStep === 2 && "Select your travel dates"}
              {currentStep === 3 && "Set your budget and travel preferences"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Location */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    placeholder="Enter your starting location"
                    value={formData.source}
                    onChange={(e) => updateFormData("source", e.target.value)}
                    aria-invalid={!!errors.source}
                  />
                  {errors.source && (
                    <p className="text-sm text-destructive">{errors.source}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="Where do you want to go?"
                    value={formData.destination}
                    onChange={(e) => updateFormData("destination", e.target.value)}
                    aria-invalid={!!errors.destination}
                  />
                  {errors.destination && (
                    <p className="text-sm text-destructive">{errors.destination}</p>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Dates */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Start Date</Label>
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
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && (
                    <p className="text-sm text-destructive">{errors.startDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
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
                          date < new Date() || 
                          (formData.startDate ? date < formData.startDate : false)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && (
                    <p className="text-sm text-destructive">{errors.endDate}</p>
                  )}
                </div>
              </>
            )}

            {/* Step 3: Budget & Travel Type */}
            {currentStep === 3 && (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Budget</Label>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        ${formData.budget.toLocaleString()}
                      </span>
                    </div>
                    <Slider
                      value={[formData.budget]}
                      onValueChange={([value]) => updateFormData("budget", value)}
                      min={500}
                      max={10000}
                      step={100}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                      <span>$500</span>
                      <span>$10,000</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="travelType">Travel Type</Label>
                  <Select
                    value={formData.travelType}
                    onValueChange={(value) => updateFormData("travelType", value)}
                  >
                    <SelectTrigger id="travelType" aria-invalid={!!errors.travelType}>
                      <SelectValue placeholder="Select travel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo Travel</SelectItem>
                      <SelectItem value="family">Family Trip</SelectItem>
                      <SelectItem value="friends">Trip with Friends</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.travelType && (
                    <p className="text-sm text-destructive">{errors.travelType}</p>
                  )}
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 space-y-2">
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                    Trip Summary
                  </h4>
                  <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <p><span className="font-medium">From:</span> {formData.source || "Not set"}</p>
                    <p><span className="font-medium">To:</span> {formData.destination || "Not set"}</p>
                    <p>
                      <span className="font-medium">Dates:</span>{" "}
                      {formData.startDate && formData.endDate
                        ? `${formatDate(formData.startDate)} - ${formatDate(formData.endDate)}`
                        : "Not set"}
                    </p>
                    <p><span className="font-medium">Budget:</span> ${formData.budget.toLocaleString()}</p>
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

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
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
              Back
            </Button>
            <Button onClick={handleNext}>
              {currentStep === 3 ? (
                <>
                  Create Trip
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
                  Next
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
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
    </div>
  );
}
