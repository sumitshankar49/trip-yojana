"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/packages/components/ui/card";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconColor?: string;
  iconBgColor?: string;
  isLoading?: boolean;
  loadingWidth?: string;
}

export function StatCard({
  label,
  value,
  icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10 dark:bg-primary/20",
  isLoading = false,
  loadingWidth = "w-12",
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-zinc-200 dark:border-zinc-800 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                {label}
              </p>
              <p 
                className="text-3xl font-bold text-zinc-900 dark:text-zinc-50"
                suppressHydrationWarning
              >
                {isLoading ? (
                  <span
                    className={`inline-block ${loadingWidth} h-9 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded`}
                  ></span>
                ) : (
                  value
                )}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center`}
            >
              <div className={`w-6 h-6 ${iconColor}`}>{icon}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
