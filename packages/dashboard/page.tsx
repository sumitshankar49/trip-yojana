"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/components/ui/card";
import { Button } from "@/packages/components/ui/button";
import Navbar from "@/packages/components/shared/Navbar";
import SearchBar from "@/packages/components/shared/SearchBar";
import EmptyState from "@/packages/components/shared/EmptyState";
import { StatCard } from "@/packages/components/dashboard/StatCard";
import { SmartGreeting } from "@/packages/components/dashboard/SmartGreeting";
import { motion } from "framer-motion";
import { TripCardSkeleton } from "@/packages/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/packages/hooks/useAuth";
import AuthLoading from "@/packages/components/auth/AuthLoading";
import { Trip } from "./types";
import { DASHBOARD_LABELS, DASHBOARD_MESSAGES } from "./constants";
import { formatDate, formatCurrency } from "./helpers";

type ApiTrip = {
  _id: string;
  title: string;
  budget: number;
  startDate: string;
  endDate: string;
  places?: string[];
};

function mapApiTripToDashboardTrip(trip: ApiTrip): Trip {
  return {
    id: String(trip._id),
    destination: trip.places?.[0] || trip.title,
    startDate: trip.startDate,
    endDate: trip.endDate,
    budget: Number(trip.budget || 0),
    currency: "INR",
  };
}

export default function DashboardPage() {
  // Client-side authentication protection
  const { status, user } = useAuth();
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadTrips = async () => {
      // Only load trips if authenticated
      if (status !== "authenticated") {
        return;
      }

      try {
        const response = await fetch("/api/trips", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data?.message || DASHBOARD_MESSAGES.LOAD_TRIPS_FAILED);
          if (isMounted) {
            setTrips([]);
          }
          return;
        }

        if (isMounted) {
          const apiTrips = Array.isArray(data?.trips) ? (data.trips as ApiTrip[]) : [];
          setTrips(apiTrips.map(mapApiTripToDashboardTrip));
        }
      } catch (error) {
        console.error("Dashboard trips load error:", error);
        toast.error(DASHBOARD_MESSAGES.LOAD_TRIPS_ERROR);
        if (isMounted) {
          setTrips([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTrips();

    return () => {
      isMounted = false;
    };
  }, [status]);

  const handleTripClick = (tripName: string) => {
    toast.success(`Opening ${tripName}`, {
      description: DASHBOARD_MESSAGES.OPENING_TRIP_DESC
    });
  };

  // Filter trips based on search query
  const filteredTrips = useMemo(() => {
    if (!searchQuery.trim()) return trips;
    
    const query = searchQuery.toLowerCase();
    return trips.filter(trip => 
      trip.destination.toLowerCase().includes(query) ||
      trip.startDate.includes(query) ||
      trip.endDate.includes(query)
    );
  }, [trips, searchQuery]);

  // Calculate stats
  const totalTrips = trips.length;
  const today = new Date();
  const upcomingTrips = trips.filter(trip => new Date(trip.startDate) > today).length;
  const totalBudget = trips.reduce((sum, trip) => sum + trip.budget, 0);

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

  // Show loading state while checking authentication
  if (status === "loading") {
    return <AuthLoading message="Verifying your session..." />;
  }

  // Don't render content if not authenticated (will redirect via useAuth)
  if (status !== "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-linear-to-br from-primary/10 via-purple-50/50 to-pink-50/50 dark:from-primary/5 dark:via-purple-950/20 dark:to-pink-950/20 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Smart Personalized Greeting */}
          <SmartGreeting
            userName={user?.name || "User"}
            upcomingTripsCount={upcomingTrips}
            totalTrips={totalTrips}
            hasRecentActivity={!isLoading && trips.length > 0}
          />

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8"
          >
            {/* Total Trips Card */}
            <StatCard
              label={DASHBOARD_LABELS.TOTAL_TRIPS_LABEL}
              value={totalTrips}
              isLoading={isLoading}
              icon={
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
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              }
              iconColor="text-primary"
              iconBgColor="bg-primary/10 dark:bg-primary/20"
            />

            {/* Upcoming Trips Card */}
            <StatCard
              label={DASHBOARD_LABELS.UPCOMING_TRIPS_LABEL}
              value={upcomingTrips}
              isLoading={isLoading}
              icon={
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
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
              iconColor="text-purple-600 dark:text-purple-400"
              iconBgColor="bg-purple-500/10 dark:bg-purple-500/20"
            />

            {/* Total Budget Card */}
            <StatCard
              label={DASHBOARD_LABELS.TOTAL_BUDGET_LABEL}
              value={formatCurrency(totalBudget, "INR")}
              isLoading={isLoading}
              loadingWidth="w-20"
              icon={
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
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
              iconColor="text-green-600 dark:text-green-400"
              iconBgColor="bg-green-500/10 dark:bg-green-500/20"
            />
          </motion.div>

          {/* Additional CTA - Only show if user has trips */}
          {totalTrips > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-center sm:justify-start mt-6"
            >
              <Button size="lg" className="group shadow-lg hover:shadow-xl transition-all" asChild>
                <Link href="/create-trip">
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 mr-2"
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </motion.svg>
                  Create New Trip
                </Link>
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex justify-center"
        >
          <SearchBar
            placeholder={DASHBOARD_LABELS.SEARCH_PLACEHOLDER}
            onSearch={setSearchQuery}
            className="w-full max-w-2xl"
          />
        </motion.div>

        {/* Search Results Info */}
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 text-sm text-muted-foreground text-center"
          >
            {filteredTrips.length === 0 ? (
              <span>No trips found for &quot;{searchQuery}&quot;</span>
            ) : (
              <span>
                Found {filteredTrips.length} {filteredTrips.length === 1 ? "trip" : "trips"} matching &quot;{searchQuery}&quot;
              </span>
            )}
          </motion.div>
        )}

        {/* Trips Grid or Empty State */}
        {isLoading ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[1, 2, 3].map((i) => (
              <motion.div key={i} variants={itemVariants}>
                <TripCardSkeleton />
              </motion.div>
            ))}
          </motion.div>
        ) : filteredTrips.length === 0 ? (
          searchQuery ? (
            <EmptyState
              title="No trips found"
              description={`No trips match "${searchQuery}". Try a different search term or create a new trip.`}
              ctaText="Clear Search"
              ctaHref="#"
              className="py-12"
            />
          ) : (
            <EmptyState
              title={DASHBOARD_LABELS.NO_TRIPS_TITLE}
              description={DASHBOARD_LABELS.NO_TRIPS_MESSAGE}
              ctaText={DASHBOARD_LABELS.CREATE_FIRST_TRIP}
              ctaHref="/create-trip"
            />
          )
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredTrips.map((trip) => (
              <motion.div
                key={trip.id}
                variants={itemVariants}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="h-full hover:shadow-2xl transition-shadow duration-300 group border-zinc-200 dark:border-zinc-800 hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {trip.destination}
                        </CardTitle>
                        <CardDescription className="mt-1.5 flex items-center gap-1.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {DASHBOARD_LABELS.BUDGET_LABEL}
                        </p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                          {formatCurrency(trip.budget, trip.currency)}
                        </p>
                      </div>
                      <motion.div 
                        className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center"
                        whileHover={{ scale: 1.1, rotate: 15 }}
                        transition={{ duration: 0.3 }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-6 h-6 text-primary"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </motion.div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 group/btn hover:bg-primary hover:text-primary-foreground transition-colors" 
                        asChild
                        onClick={() => handleTripClick(trip.destination)}
                      >
                        <Link href="/itinerary">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4 mr-1 group-hover/btn:scale-110 transition-transform"
                          >
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" />
                            <line x1="3" y1="12" x2="3.01" y2="12" />
                            <line x1="3" y1="18" x2="3.01" y2="18" />
                          </svg>
                          {DASHBOARD_LABELS.ITINERARY_BUTTON}
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 group/btn hover:bg-primary hover:text-primary-foreground transition-colors" 
                        asChild
                      >
                        <Link href={`/map?destination=${encodeURIComponent(trip.destination)}`}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4 mr-1 group-hover/btn:scale-110 transition-transform"
                          >
                            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                            <line x1="9" y1="3" x2="9" y2="18" />
                            <line x1="15" y1="6" x2="15" y2="21" />
                          </svg>
                          {DASHBOARD_LABELS.MAP_BUTTON}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
