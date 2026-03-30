"use client";

import { useState, ReactNode, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/packages/components/ui/card";
import { cn } from "@/packages/lib/utils";
import Navbar from "@/packages/components/shared/Navbar";
import { TripFilter, type TripOption } from "@/packages/components/shared/TripFilter";
import { motion } from "framer-motion";
import { CardSkeleton } from "@/packages/components/ui/skeleton";
import { TRIP_BUDGETS, type CategoryBudget } from "@/packages/constants/tripBudgets";
import { toast } from "sonner";

type ApiTrip = {
  _id: string;
  title: string;
  places?: string[];
};

const getCategoryIcon = (categoryName: string): ReactNode => {
  if (categoryName.includes("Transport") || categoryName.includes("Travel")) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    );
  }
  if (categoryName.includes("Accommodation") || categoryName.includes("Hotel")) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M3 10h18" />
        <path d="M3 14h18" />
        <path d="M5 18h14" />
        <path d="M3 6h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />
        <path d="M9 2v4" />
        <path d="M15 2v4" />
      </svg>
    );
  }
  if (categoryName.includes("Food") || categoryName.includes("Dining")) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
};

export default function BudgetPage() {
  const [selectedTripId, setSelectedTripId] = useState("");
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [isTripsLoading, setIsTripsLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fallbackBudget = TRIP_BUDGETS[Object.keys(TRIP_BUDGETS)[0]];
  const currentTripBudget = TRIP_BUDGETS[selectedTripId] || fallbackBudget;
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);

  const budgetData = currentTripBudget.categories.map(cat => ({
    ...cat,
    icon: getCategoryIcon(cat.name)
  }));

  useEffect(() => {
    let isMounted = true;

    const loadTrips = async () => {
      try {
        const response = await fetch("/api/trips", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          toast.error(data?.message || "Failed to load trips");
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

        if (!isMounted) {
          return;
        }

        setTrips(mappedTrips);
        setSelectedTripId(mappedTrips[0]?.id || "");
      } catch (error) {
        console.error("Budget trips load error:", error);
        toast.error("Could not load trips");
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

  const totalSpent = budgetData.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = currentTripBudget.totalBudget - totalSpent;
  const spentPercentage = (totalSpent / currentTripBudget.totalBudget) * 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryPercentage = (category: CategoryBudget) => {
    return (category.spent / category.allocated) * 100;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-orange-500";
    return "bg-green-500";
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
              Budget Tracker
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              {selectedTrip?.destination || currentTripBudget.tripName} - {currentTripBudget.dates}
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
                    Total Budget
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
                    {formatCurrency(currentTripBudget.totalBudget)}
                  </motion.div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    Allocated for entire trip
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Spent */}
            <motion.div variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Total Spent
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
                    Remaining
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
                    Available to spend
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Overall Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Overall Budget Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {formatCurrency(totalSpent)} spent of {formatCurrency(currentTripBudget.totalBudget)}
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
            Budget by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {budgetData.map((category) => {
              const percentage = getCategoryPercentage(category);
              const remaining = category.allocated - category.spent;

              return (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center text-white",
                            category.color
                          )}
                        >
                          {category.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {formatCurrency(category.allocated)} allocated
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                          {formatCurrency(category.spent)}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">spent</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                          {formatCurrency(remaining)}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">remaining</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400">Progress</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-500",
                            getProgressColor(percentage)
                          )}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {percentage >= 90 && (
                      <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Getting close to budget limit
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Simple Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetData.map((category) => {
                const categoryPercentage = (category.spent / totalSpent) * 100;

                return (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", category.color)} />
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {category.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {formatCurrency(category.spent)}
                        </span>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 ml-2">
                          ({categoryPercentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-500", category.color)}
                        style={{ width: `${categoryPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
