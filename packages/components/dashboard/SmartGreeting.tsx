"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/packages/components/ui/card";
import Link from "next/link";

interface SmartGreetingProps {
  userName?: string;
  upcomingTripsCount: number;
  totalTrips: number;
  hasRecentActivity?: boolean;
}

export function SmartGreeting({
  userName = "Sumit",
  upcomingTripsCount,
  totalTrips,
  hasRecentActivity = false,
}: SmartGreetingProps) {
  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours(); // Gets 0-23
    if (hour < 12) {
      return "Good morning"; // 12am - 11:59am
    } else if (hour < 18) {
      return "Good afternoon"; // 12pm - 5:59pm
    } else {
      return "Good evening"; // 6pm - 11:59pm
    }
  };

  // Get greeting emoji
  const getGreetingEmoji = () => {
    const hour = new Date().getHours(); // Gets 0-23
    if (hour < 12) {
      return "🌅"; // Morning
    } else if (hour < 18) {
      return "☀️"; // Afternoon
    } else {
      return "🌙"; // Evening
    }
  };

  // Generate smart suggestions based on user data
  const getSmartSuggestions = () => {
    const suggestions = [];

    if (totalTrips === 0) {
      suggestions.push({
        id: 1,
        title: "Create your first trip",
        description: "Start planning your dream vacation",
        icon: "✈️",
        action: "/create-trip",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
      });
    } else if (upcomingTripsCount === 0) {
      suggestions.push({
        id: 1,
        title: "Plan your next adventure",
        description: "You don't have any upcoming trips",
        icon: "🗺️",
        action: "/create-trip",
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
      });
    } else if (upcomingTripsCount > 0) {
      suggestions.push({
        id: 1,
        title: "Review your itinerary",
        description: `${upcomingTripsCount} ${upcomingTripsCount === 1 ? 'trip' : 'trips'} coming up soon`,
        icon: "📅",
        action: "/itinerary",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-500/10 dark:bg-green-500/20",
      });
    }

    // Add budget suggestion if there are trips
    if (totalTrips > 0) {
      suggestions.push({
        id: 2,
        title: "Track your expenses",
        description: "Keep your budget on track",
        icon: "💰",
        action: "/expenses",
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
      });
    }

    // Always show explore destinations
    suggestions.push({
      id: 3,
      title: "Explore destinations",
      description: "Discover new places to visit",
      icon: "🌍",
      action: "/map",
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-500/10 dark:bg-cyan-500/20",
    });

    return suggestions.slice(0, 3); // Return max 3 suggestions
  };

  const suggestions = getSmartSuggestions();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Personalized Greeting */}
      <div className="flex items-center gap-3">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-4xl"
        >
          {getGreetingEmoji()}
        </motion.span>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            {getGreeting()}, <span className="text-primary">{userName}</span> 👋
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mt-1">
            {totalTrips === 0 ? (
              "Ready to start your travel journey?"
            ) : upcomingTripsCount === 0 ? (
              "Your next adventure awaits!"
            ) : (
              <>
                You have{" "}
                <span className="font-semibold text-primary">
                  {upcomingTripsCount}
                </span>{" "}
                upcoming {upcomingTripsCount === 1 ? "trip" : "trips"} 🎒
              </>
            )}
          </p>
        </div>
      </div>

      {/* Smart Suggestions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-xl"
          >
            💡
          </motion.span>
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
            Smart Suggestions
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href={suggestion.action}>
                <Card className="h-full border-zinc-200 dark:border-zinc-800 hover:border-primary/50 transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${suggestion.bgColor} shrink-0`}
                      >
                        <span className="text-2xl">{suggestion.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold text-sm mb-1 ${suggestion.color} group-hover:underline`}
                        >
                          {suggestion.title}
                        </h3>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {suggestion.description}
                        </p>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4 text-zinc-400 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Activity Insight */}
      {hasRecentActivity && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>You&apos;ve been active recently</span>
        </motion.div>
      )}
    </motion.div>
  );
}
