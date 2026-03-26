"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/packages/components/shared/Navbar";
import { Button } from "@/packages/components/ui/button";
import { Badge } from "@/packages/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/packages/components/ui/tabs";
import { NotificationItem, NotificationEmptyState, type Notification } from "@/packages/components/shared/NotificationItem";

const ALL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "expense",
    title: "New Expense Added",
    message: "Rahul added ₹1,200 for hotel booking in Golden Temple trip",
    time: "5 min ago",
    isRead: false,
    link: "/expenses",
  },
  {
    id: "2",
    type: "payment_reminder",
    title: "Payment Reminder",
    message: "You owe Priya ₹500 for restaurant bill",
    time: "1 hour ago",
    isRead: false,
    link: "/expenses",
  },
  {
    id: "3",
    type: "trip_update",
    title: "Trip Dates Modified",
    message: "Golden Temple trip has been rescheduled to next month",
    time: "2 hours ago",
    isRead: false,
    link: "/dashboard",
  },
  {
    id: "4",
    type: "booking",
    title: "Hotel Booking Confirmed",
    message: "Your hotel booking for Amritsar has been confirmed",
    time: "5 hours ago",
    isRead: true,
    link: "/itinerary",
  },
  {
    id: "5",
    type: "expense",
    title: "Expense Split Updated",
    message: "Amit updated the taxi fare split for airport transfer",
    time: "1 day ago",
    isRead: true,
    link: "/expenses",
  },
  {
    id: "6",
    type: "itinerary",
    title: "New Activity Added",
    message: "Sneha added 'Visit Wagah Border' to the itinerary",
    time: "1 day ago",
    isRead: true,
    link: "/itinerary",
  },
  {
    id: "7",
    type: "alert",
    title: "Budget Alert",
    message: "You're approaching 80% of your trip budget",
    time: "2 days ago",
    isRead: true,
    link: "/budget",
  },
  {
    id: "8",
    type: "trip_update",
    title: "New Member Added",
    message: "Kavya joined your Kedarnath trip",
    time: "3 days ago",
    isRead: true,
    link: "/dashboard",
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(ALL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filteredNotifications = 
    filter === "unread" 
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                Notifications
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Stay updated with your trip activities
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                className="gap-2"
              >
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
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Mark all as read
              </Button>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")} className="w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all" className="flex-1 sm:flex-none gap-2">
                All
                <Badge variant="secondary" className="h-5 px-2">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1 sm:flex-none gap-2">
                Unread
                {unreadCount > 0 && (
                  <Badge className="h-5 px-2 bg-primary text-primary-foreground">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {filteredNotifications.length === 0 ? (
                <NotificationEmptyState />
              ) : (
                <motion.div
                  className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {filteredNotifications.map((notification, index) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      index={index}
                      showMarkAsRead={true}
                    />
                  ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="unread" className="mt-6">
              {filteredNotifications.length === 0 ? (
                <NotificationEmptyState />
              ) : (
                <motion.div
                  className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {filteredNotifications.map((notification, index) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      index={index}
                      showMarkAsRead={true}
                    />
                  ))}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
