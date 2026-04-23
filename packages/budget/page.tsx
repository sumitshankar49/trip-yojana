"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/packages/components/ui/card";
import { cn } from "@/packages/lib/utils";
import Navbar from "@/packages/components/shared/Navbar";
import { TripFilter, type TripOption } from "@/packages/components/shared/TripFilter";
import { motion } from "framer-motion";
import { CardSkeleton } from "@/packages/components/ui/skeleton";

import { toast } from "sonner";
import { BUDGET_LABELS, BUDGET_MESSAGES } from "./constants";

type ApiTrip = {
  _id: string;
  title: string;
  budget: number;
  places?: string[];
  startDate: string;
  endDate: string;
};


export default function BudgetPage() {
  const [selectedTripId, setSelectedTripId] = useState("");
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [isTripsLoading, setIsTripsLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [tripBudgets, setTripBudgets] = useState<Record<string, number>>({});
  const [tripDates, setTripDates] = useState<Record<string, string>>({});

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);
  const selectedBudget = tripBudgets[selectedTripId] ?? 0;

  useEffect(() => {
    let isMounted = true;

    const loadTrips = async () => {
      try {
        const response = await fetch("/api/trips", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          toast.error(data?.message || BUDGET_MESSAGES.LOAD_TRIPS_FAILED);
          if (isMounted) {
            setTrips([]);
            setSelectedTripId("");
          }
          return;
        }

        const apiTrips = Array.isArray(data?.trips) ? (data.trips as ApiTrip[]) : [];
        const mappedTrips: TripOption[] = apiTrips.map((trip) => ({
          id: String(trip._id),
          destination: trip.places?.[0] || trip.title,
        }));

        const budgets: Record<string, number> = {};
        const dates: Record<string, string> = {};
        apiTrips.forEach((trip) => {
          budgets[String(trip._id)] = trip.budget ?? 0;
          const start = new Date(trip.startDate).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          });
          dates[String(trip._id)] = start;
        });

        if (!isMounted) {
          return;
        }

        setTrips(mappedTrips);
        setTripBudgets(budgets);
        setTripDates(dates);
        setSelectedTripId(mappedTrips[0]?.id || "");
      } catch (error) {
        console.error("Budget trips load error:", error);
        toast.error(BUDGET_MESSAGES.LOAD_TRIPS_ERROR);
        if (isMounted) {
          setTrips([]);
          setSelectedTripId("");
        }
      } finally {
        if (isMounted) {
          setIsTripsLoading(false);
        }
      }
    };

    loadTrips();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [selectedTripId]);

  const totalSpent = 0;
  const totalRemaining = selectedBudget;
  const spentPercentage = selectedBudget > 0 ? (totalSpent / selectedBudget) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {BUDGET_LABELS.PAGE_TITLE}
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              {selectedTrip?.destination || ""}{tripDates[selectedTripId] ? ` - ${tripDates[selectedTripId]}` : ""}
            </p>
          </div>
          <div className="w-64">
            <TripFilter
              selectedTripId={selectedTripId}
              onTripChange={setSelectedTripId}
              trips={trips}
              isLoading={isTripsLoading}
            />
          </div>
        </motion.div>

        {/* Summary Cards */}
        {isLoading ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {[1, 2, 3].map((i) => (
              <motion.div key={i} variants={itemVariants}>
                <CardSkeleton />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {/* Total Budget */}
            <motion.div variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {BUDGET_LABELS.TOTAL_BUDGET_LABEL}
                  </CardTitle>
                  <motion.div 
                    className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 text-blue-600 dark:text-blue-400"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M7 15h0M2 9.5h20" />
                    </svg>
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    className="text-3xl font-bold text-zinc-900 dark:text-zinc-50"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    {formatCurrency(selectedBudget)}
                  </motion.div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    {BUDGET_LABELS.TOTAL_BUDGET_DESC}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Spent */}
            <motion.div variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {BUDGET_LABELS.TOTAL_SPENT_LABEL}
                  </CardTitle>
                  <motion.div 
                    className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 text-orange-600 dark:text-orange-400"
                    >
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    className="text-3xl font-bold text-zinc-900 dark:text-zinc-50"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    {formatCurrency(totalSpent)}
                  </motion.div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    {spentPercentage.toFixed(1)}% of budget used
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Remaining */}
            <motion.div variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {BUDGET_LABELS.REMAINING_LABEL}
                  </CardTitle>
                  <motion.div 
                    className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 text-green-600 dark:text-green-400"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    className="text-3xl font-bold text-zinc-900 dark:text-zinc-50"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    {formatCurrency(totalRemaining)}
                  </motion.div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    {BUDGET_LABELS.REMAINING_DESC}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Overall Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{BUDGET_LABELS.OVERALL_PROGRESS_TITLE}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {formatCurrency(totalSpent)} spent of {formatCurrency(selectedBudget)}
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {spentPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    getProgressColor(spentPercentage)
                  )}
                  style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            {BUDGET_LABELS.CATEGORY_SECTION_TITLE}
          </h2>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M7 15h0M2 9.5h20" />
              </svg>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">No category budgets yet</p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                Add expenses to track spending by category
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Simple Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4"
              >
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">No spending data yet</p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                Your spending breakdown will appear here once you add expenses
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
