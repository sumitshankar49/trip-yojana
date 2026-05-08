"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Navbar from "@/packages/components/shared/Navbar";
import { Button } from "@/packages/components/ui/button";
import { Badge } from "@/packages/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/packages/components/ui/tabs";
import { NotificationItem, NotificationEmptyState, type Notification } from "@/packages/components/shared/NotificationItem";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function formatTimeAgo(date: string): string {
  const now = new Date();
  const notifDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - notifDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    return notifDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/notifications?filter=${filter}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.message || "Failed to load notifications");
        setNotifications([]);
        return;
      }

      const formattedNotifications = data.notifications.map((notif: any) => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        time: formatTimeAgo(notif.createdAt),
        isRead: notif.isRead,
        link: notif.link || "#",
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error("Load notifications error:", error);
      toast.error("Failed to load notifications");
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        toast.error("Failed to mark notification as read");
        return;
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Mark as read error:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (!response.ok) {
        toast.error("Failed to mark all as read");
        return;
      }

      toast.success("All notifications marked as read");
      
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Mark all as read error:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const filteredNotifications = notifications;

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
            {unreadCount > 0 && !isLoading && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                className="gap-2"
                disabled={isLoading}
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
              <TabsTrigger value="all" className="flex-1 sm:flex-none gap-2" disabled={isLoading}>
                All
                {!isLoading && (
                  <Badge variant="secondary" className="h-5 px-2">
                    {notifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1 sm:flex-none gap-2" disabled={isLoading}>
                Unread
                {!isLoading && unreadCount > 0 && (
                  <Badge className="h-5 px-2 bg-primary text-primary-foreground">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <NotificationEmptyState message={filter === "unread" ? "No unread notifications" : "No notifications yet"} />
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
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <NotificationEmptyState message="No unread notifications" />
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
