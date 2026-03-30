"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/packages/components/ui/button";
import { Badge } from "@/packages/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/packages/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/packages/components/ui/tooltip";
import { ThemeToggle } from "@/packages/components/shared/ThemeToggle";
import UserButton from "@/packages/components/auth/UserButton";

interface Notification {
  id: string;
  type: "expense" | "payment_reminder" | "trip_update" | "itinerary";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  link?: string;
}

const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "expense",
    title: "New Expense Added",
    message: "Rahul added ₹1,200 for hotel booking",
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
    type: "expense",
    title: "Expense Split Updated",
    message: "Amit updated the taxi fare split",
    time: "2 hours ago",
    isRead: true,
    link: "/expenses",
  },
  {
    id: "4",
    type: "trip_update",
    title: "Trip Details Updated",
    message: "Golden Temple trip dates have been modified",
    time: "1 day ago",
    isRead: true,
    link: "/dashboard",
  },
];

const NOTIFICATION_ICONS = {
  expense: "💰",
  payment_reminder: "🔔",
  trip_update: "✈️",
  itinerary: "📅",
};

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  tooltip: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>(DUMMY_NOTIFICATIONS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const navLinks: NavLink[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      tooltip: "View all your trips",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      href: "/itinerary",
      label: "Itinerary",
      tooltip: "Manage daily activities",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
    },
    {
      href: "/map",
      label: "Map",
      tooltip: "View locations on map",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
          <line x1="9" y1="3" x2="9" y2="18" />
          <line x1="15" y1="6" x2="15" y2="21" />
        </svg>
      ),
    },
    {
      href: "/budget",
      label: "Budget",
      tooltip: "Track your spending",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      href: "/expenses",
      label: "Expenses",
      tooltip: "Manage group expenses",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z" />
          <path d="M2 9v1c0 1.1.9 2 2 2h1" />
          <path d="M16 11h0" />
        </svg>
      ),
    },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 sticky top-0 z-50 border-b border-zinc-200/50 dark:border-zinc-700/50"
    >
      <div className="w-full mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <motion.div
              className="relative w-10 h-10"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Image
                src="/brand_logo.png"
                alt="TripYojana"
                fill
                className="object-contain"
                priority
              />
            </motion.div>
            <motion.h1
              className="text-xl font-bold text-primary dark:text-primary"
              whileHover={{ letterSpacing: "0.05em" }}
              transition={{ duration: 0.3 }}
            >
              TripYojana
            </motion.h1>
          </Link>

          {/* Navigation Links */}
          <motion.div
            className="hidden md:flex items-center gap-2 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-full p-1"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {navLinks.map((link, index) => {
              const isActive = pathname === link.href;
              return (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={link.href}>
                        <motion.button
                          className={`
                            relative px-4 py-2 rounded-full text-sm font-medium
                            flex items-center gap-2
                            ${
                              isActive
                                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                            }
                          `}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <motion.span
                            whileHover={{ scale: 1.2, rotate: 360 }}
                          >
                            {link.icon}
                          </motion.span>
                          <span className="hidden lg:inline">{link.label}</span>
                        </motion.button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{link.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Right Section - Notifications & Auth */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="relative hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
                        aria-label="Notifications"
                      >
                        <motion.svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-5 h-5"
                          animate={
                            unreadCount > 0
                              ? {
                                  rotate: [0, 15, -15, 15, -15, 0],
                                  transition: { duration: 0.8, repeat: Infinity, repeatDelay: 3 }
                                }
                              : {}
                          }
                        >
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </motion.svg>
                        <AnimatePresence>
                          {unreadCount > 0 && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ 
                                scale: 1, 
                                opacity: 1,
                              }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            >
                              <Badge
                                className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 text-[10px] font-bold bg-red-500 text-white border-2 border-white dark:border-zinc-900 shadow-lg"
                              >
                                <motion.span
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  {unreadCount}
                                </motion.span>
                              </Badge>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}</p>
                </TooltipContent>
              </Tooltip>

              <PopoverContent className="w-96 p-0" align="end" asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-50">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="h-5 px-2 text-xs bg-primary/10 text-primary border-primary/20"
                      >
                        {unreadCount} new
                      </Badge>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs h-7 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-112.5 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <motion.div 
                      className="py-16 text-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <motion.div
                        className="w-16 h-16 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-8 h-8 text-zinc-400"
                        >
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </motion.div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-1">
                        All caught up!
                      </p>
                      <p className="text-xs text-zinc-500">
                        No new notifications right now
                      </p>
                    </motion.div>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          className="group relative"
                        >
                          <Link
                            href={notification.link || "#"}
                            onClick={() => {
                              handleMarkAsRead(notification.id);
                              setIsNotificationsOpen(false);
                            }}
                          >
                            <motion.div
                              className={`
                                p-4 transition-all duration-200 cursor-pointer
                                ${!notification.isRead 
                                  ? "bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/15" 
                                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                }
                              `}
                              whileHover={{ x: 2 }}
                              transition={{ duration: 0.15 }}
                            >
                              <div className="flex items-start gap-3">
                                {/* Icon */}
                                <motion.div 
                                  className={`
                                    shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg
                                    ${!notification.isRead 
                                      ? "bg-primary/10 dark:bg-primary/20" 
                                      : "bg-zinc-100 dark:bg-zinc-800"
                                    }
                                  `}
                                  whileHover={{ scale: 1.1, rotate: 10 }}
                                  transition={{ type: "spring", stiffness: 400 }}
                                >
                                  {NOTIFICATION_ICONS[notification.type]}
                                </motion.div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className={`
                                      font-medium text-sm leading-tight
                                      ${!notification.isRead 
                                        ? "text-zinc-900 dark:text-zinc-50" 
                                        : "text-zinc-700 dark:text-zinc-300"
                                      }
                                    `}>
                                      {notification.title}
                                    </p>
                                    {!notification.isRead && (
                                      <motion.div 
                                        className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                      />
                                    )}
                                  </div>
                                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                      {notification.time}
                                    </p>
                                    {!notification.isRead && (
                                      <span className="text-xs text-primary font-medium">
                                        • New
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Mark as Read Button (on hover) */}
                              {!notification.isRead && (
                                <motion.button
                                  initial={{ opacity: 0 }}
                                  whileHover={{ opacity: 1 }}
                                  className="absolute top-3 right-3 p-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  whileTap={{ scale: 0.9 }}
                                  aria-label="Mark as read"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-3.5 h-3.5 text-primary"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </motion.button>
                              )}
                            </motion.div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <Link href="/notifications">
                      <motion.button
                        className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium py-2 rounded-lg hover:bg-primary/5 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        View all notifications
                      </motion.button>
                    </Link>
                  </div>
                )}
                </motion.div>
              </PopoverContent>
            </Popover>

            {/* Theme Toggle */}
            <ThemeToggle />

            <UserButton />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.div
        className="md:hidden border-t border-zinc-200/50 dark:border-zinc-700/50 px-4 py-3 overflow-x-auto bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="flex items-center gap-2 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-full p-1">
          {navLinks.map((link, index) => {
            const isActive = pathname === link.href;
            return (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
              >
                <Link href={link.href}>
                  <motion.button
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                      flex items-center gap-1.5
                      ${
                        isActive
                          ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm"
                          : "text-zinc-600 dark:text-zinc-400"
                      }
                    `}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </motion.button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.nav>
  );
}
