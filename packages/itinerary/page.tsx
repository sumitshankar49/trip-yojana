"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "@/packages/components/shared/Navbar";
import { Card, CardContent } from "@/packages/components/ui/card";
import { Button } from "@/packages/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/packages/components/ui/tabs";
import { Badge } from "@/packages/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/packages/components/ui/popover";
import { cn } from "@/packages/lib/utils";
import { toast } from "@/packages/lib/toast";
import { TRIP_ITINERARIES } from "@/packages/constants/tripItineraries";

export default function ItineraryPage() {
  const [selectedTripId] = useState("1");
  const [selectedDay, setSelectedDay] = useState("1");
  const [showMap, setShowMap] = useState(false);
  
  const currentTrip = TRIP_ITINERARIES[selectedTripId];
  const currentDayData = currentTrip.days.find((day) => day.id.toString() === selectedDay);
  
  // Calculate totals
  const totalDays = currentTrip.days.length;
  const totalBudget = currentTrip.days.reduce(
    (sum, day) => sum + day.activities.reduce((daySum, activity) => daySum + activity.cost, 0),
    0
  );

  const dayBudget = currentDayData?.activities.reduce((sum, activity) => sum + activity.cost, 0) || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Share functionality
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = `${currentTrip.title} - Trip Itinerary`;
  const shareText = `Check out my trip to ${currentTrip.title} (${currentTrip.dates})`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleEmailShare = () => {
    const emailUrl = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    window.location.href = emailUrl;
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank");
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      {/* ============ STICKY HEADER ============ */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left: Trip Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4">
                  {/* Trip Icon */}
                  <div className="hidden sm:flex shrink-0 w-14 h-14 rounded-2xl bg-linear-to-br from-primary/20 to-purple-500/20 items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-7 h-7 text-primary"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>

                  {/* Trip Details */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 truncate">
                      {currentTrip.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
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
                        <span className="font-medium">{currentTrip.dates}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
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
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{totalDays} days</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
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
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(totalBudget)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="default" className="gap-2">
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
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" align="end">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm mb-3 text-zinc-900 dark:text-zinc-50">
                        Share Itinerary
                      </h4>
                      
                      {/* Copy Link */}
                      <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
                          >
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Copy Link</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">Share via clipboard</p>
                        </div>
                      </button>

                      {/* WhatsApp */}
                      <button
                        onClick={handleWhatsAppShare}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 text-green-600 dark:text-green-400"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">WhatsApp</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">Share on WhatsApp</p>
                        </div>
                      </button>

                      {/* Email */}
                      <button
                        onClick={handleEmailShare}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
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
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Email</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">Share via email</p>
                        </div>
                      </button>

                      {/* Twitter */}
                      <button
                        onClick={handleTwitterShare}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 flex items-center justify-center shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 text-sky-600 dark:text-sky-400"
                          >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Twitter</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">Post on Twitter</p>
                        </div>
                      </button>

                      {/* Facebook */}
                      <button
                        onClick={handleFacebookShare}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 text-blue-600 dark:text-blue-400"
                          >
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Facebook</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">Share on Facebook</p>
                        </div>
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ============ SUMMARY ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
        >
          {/* Total Budget */}
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Budget</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(totalBudget)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                  >
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Days */}
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Days</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{totalDays}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Places to Visit */}
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Places</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {currentTrip.days.reduce((sum, day) => sum + day.activities.length, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6 text-purple-600 dark:text-purple-400"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ============ DAY TABS ============ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Tabs value={selectedDay} onValueChange={setSelectedDay}>
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-zinc-100 dark:bg-zinc-900">
                {currentTrip.days.map((day) => (
                  <TabsTrigger key={day.id} value={day.id.toString()}>
                    Day {day.id}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Map Toggle */}
              <Button
                variant={showMap ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMap(!showMap)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 mr-2"
                >
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                  <line x1="9" y1="3" x2="9" y2="18" />
                  <line x1="15" y1="6" x2="15" y2="21" />
                </svg>
                {showMap ? "Hide Map" : "Show Map"}
              </Button>
            </div>

            {/* ============ MAIN CONTENT AREA ============ */}
            <div className={cn("grid gap-6", showMap ? "lg:grid-cols-2" : "lg:grid-cols-1")}>
              {/* Timeline View */}
              <div>
                {currentTrip.days.map((day) => (
                  <TabsContent key={day.id} value={day.id.toString()} className="mt-0">
                    {/* Day Header */}
                    <Card className="border-zinc-200 dark:border-zinc-800 mb-4">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                              {day.date}
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              {day.activities.length} activities planned
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-sm">
                            {formatCurrency(
                              day.activities.reduce((sum, activity) => sum + activity.cost, 0)
                            )}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Timeline Activities */}
                    <div className="space-y-4">
                      <AnimatePresence mode="popLayout">
                        {day.activities.map((activity, index) => (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card className="border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-shadow group">
                              <CardContent className="p-5">
                                <div className="flex gap-4">
                                  {/* Timeline Marker */}
                                  <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                      <span className="text-sm font-semibold">
                                        {activity.time.split(" ")[0]}
                                      </span>
                                    </div>
                                    {index < day.activities.length - 1 && (
                                      <div className="w-0.5 h-full bg-zinc-200 dark:bg-zinc-800 mt-2" />
                                    )}
                                  </div>

                                  {/* Activity Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-1 group-hover:text-primary transition-colors">
                                          {activity.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="w-3.5 h-3.5"
                                          >
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                          </svg>
                                          <span>{activity.time}</span>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                                          {activity.cost === 0
                                            ? "Free"
                                            : formatCurrency(activity.cost)}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                                        Edit
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                                        Delete
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                                        Details
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </TabsContent>
                ))}
              </div>

              {/* ============ MAP PREVIEW ============ */}
              <AnimatePresence>
                {showMap && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="lg:sticky lg:top-8 h-fit"
                  >
                    <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden">
                      <CardContent className="p-0">
                        {/* Map Preview with Decorative Background */}
                        <div className="relative bg-linear-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950 dark:via-cyan-950 dark:to-teal-950 aspect-square flex items-center justify-center overflow-hidden">
                          {/* Decorative Map Grid Lines */}
                          <div className="absolute inset-0 opacity-10">
                            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>
                          </div>

                          {/* Decorative Route Path */}
                          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 400">
                            <path
                              d="M 50 200 Q 100 100, 200 150 T 350 200"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray="10 5"
                              className="text-primary"
                            />
                            <circle cx="50" cy="200" r="8" fill="currentColor" className="text-green-500" />
                            <circle cx="200" cy="150" r="8" fill="currentColor" className="text-blue-500" />
                            <circle cx="350" cy="200" r="8" fill="currentColor" className="text-red-500" />
                          </svg>

                          {/* Center Content */}
                          <div className="relative text-center p-8 z-10">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                              className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-lg flex items-center justify-center"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-10 h-10 text-primary"
                              >
                                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                                <line x1="9" y1="3" x2="9" y2="18" />
                                <line x1="15" y1="6" x2="15" y2="21" />
                              </svg>
                            </motion.div>
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                              Interactive Map View
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                              View all locations on the map
                            </p>
                            <Button variant="outline" size="sm" asChild className="shadow-md hover:shadow-lg transition-shadow">
                              <Link href="/map">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="w-4 h-4 mr-2"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 16 16 12 12 8" />
                                  <line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                                Open Full Map
                              </Link>
                            </Button>
                          </div>

                          {/* Floating Location Markers */}
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-20 left-16 w-8 h-8 rounded-full bg-red-500/20 dark:bg-red-500/30 backdrop-blur-sm flex items-center justify-center"
                          >
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                          </motion.div>
                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute bottom-24 right-20 w-8 h-8 rounded-full bg-blue-500/20 dark:bg-blue-500/30 backdrop-blur-sm flex items-center justify-center"
                          >
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                          </motion.div>
                          <motion.div
                            animate={{ y: [0, -12, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute top-32 right-24 w-8 h-8 rounded-full bg-green-500/20 dark:bg-green-500/30 backdrop-blur-sm flex items-center justify-center"
                          >
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Day Summary */}
                    <Card className="border-zinc-200 dark:border-zinc-800 mt-4">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                          Day {selectedDay} Summary
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">Activities:</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              {currentDayData?.activities.length || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">Total Cost:</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              {formatCurrency(dayBudget)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">Duration:</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              Full Day
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
