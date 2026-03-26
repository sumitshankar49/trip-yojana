"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export interface Notification {
  id: string;
  type: "expense" | "payment_reminder" | "trip_update" | "itinerary" | "booking" | "alert";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  link?: string;
  icon?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onClose?: () => void;
  index?: number;
  showMarkAsRead?: boolean;
}

const NOTIFICATION_ICONS: Record<string, string> = {
  expense: "💰",
  payment_reminder: "🔔",
  trip_update: "✈️",
  itinerary: "📅",
  booking: "🎫",
  alert: "⚠️",
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onClose,
  index = 0,
  showMarkAsRead = true,
}: NotificationItemProps) {
  const icon = notification.icon || NOTIFICATION_ICONS[notification.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative"
    >
      <Link
        href={notification.link || "#"}
        onClick={() => {
          if (onMarkAsRead && !notification.isRead) {
            onMarkAsRead(notification.id);
          }
          onClose?.();
        }}
      >
        <motion.div
          className={`
            p-4 transition-all duration-200 cursor-pointer border-b border-zinc-100 dark:border-zinc-800
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
              {icon}
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
          {showMarkAsRead && !notification.isRead && onMarkAsRead && (
            <motion.button
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkAsRead(notification.id);
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
  );
}

export function NotificationEmptyState() {
  return (
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
  );
}
