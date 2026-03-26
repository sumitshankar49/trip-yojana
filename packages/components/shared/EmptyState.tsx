"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/packages/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  className?: string;
}

export default function EmptyState({
  title = "No trips yet",
  description = "Start planning your next adventure by creating your first trip",
  ctaText = "Create Trip",
  ctaHref = "/create-trip",
  className = "",
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}
    >
      {/* Illustration */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
      >
        <svg
          width="240"
          height="240"
          viewBox="0 0 240 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-48 h-48 sm:w-60 sm:h-60"
        >
          {/* Airplane illustration */}
          <motion.g
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* Clouds */}
            <ellipse
              cx="60"
              cy="80"
              rx="35"
              ry="20"
              className="fill-zinc-200 dark:fill-zinc-700"
              opacity="0.6"
            />
            <ellipse
              cx="180"
              cy="90"
              rx="40"
              ry="22"
              className="fill-zinc-200 dark:fill-zinc-700"
              opacity="0.5"
            />
            <ellipse
              cx="140"
              cy="60"
              rx="30"
              ry="18"
              className="fill-zinc-200 dark:fill-zinc-700"
              opacity="0.7"
            />
          </motion.g>

          {/* Globe/Earth background */}
          <motion.circle
            cx="120"
            cy="140"
            r="70"
            className="fill-primary/10 dark:fill-primary/20"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
          <motion.path
            d="M 120,70 Q 150,100 120,130 Q 90,100 120,70 Z"
            className="fill-primary/20 dark:fill-primary/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          />
          <motion.path
            d="M 120,130 Q 150,160 120,190 Q 90,160 120,130 Z"
            className="fill-primary/15 dark:fill-primary/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          />

          {/* Airplane */}
          <motion.g
            initial={{ x: -100, y: 50, rotate: -15 }}
            animate={{ x: 0, y: 0, rotate: 0 }}
            transition={{
              duration: 1.2,
              delay: 0.5,
              type: "spring",
              stiffness: 100,
            }}
          >
            {/* Airplane body */}
            <path
              d="M 140 105 L 180 115 L 185 120 L 182 122 L 175 120 L 165 135 L 160 133 L 165 120 L 155 117 L 150 125 L 145 123 L 148 115 L 140 113 Z"
              className="fill-primary dark:fill-primary"
            />
            {/* Airplane wings */}
            <path
              d="M 155 117 L 170 112 L 175 115 L 165 120 Z"
              className="fill-primary/80 dark:fill-primary/90"
            />
            {/* Airplane tail */}
            <path
              d="M 140 110 L 145 105 L 148 110 Z"
              className="fill-primary/70 dark:fill-primary/80"
            />
            {/* Window */}
            <circle cx="160" cy="117" r="2" className="fill-white" />
          </motion.g>

          {/* Dashed flight path */}
          <motion.path
            d="M 50,170 Q 85,140 120,130 T 190,120"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="8 8"
            className="stroke-zinc-300 dark:stroke-zinc-600"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.8 }}
          />

          {/* Location markers */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 1.2 }}
          >
            <circle cx="50" cy="170" r="6" className="fill-primary" />
            <path
              d="M 50,162 L 50,170 L 44,170 Z"
              className="fill-primary"
            />
          </motion.g>
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 1.4 }}
          >
            <circle cx="190" cy="120" r="6" className="fill-secondary" />
            <path
              d="M 190,112 L 190,120 L 184,120 Z"
              className="fill-secondary"
            />
          </motion.g>

          {/* Decorative stars */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, delay: 1.5, repeat: Infinity }}
          >
            <path
              d="M 30,50 L 32,55 L 37,55 L 33,58 L 35,63 L 30,60 L 25,63 L 27,58 L 23,55 L 28,55 Z"
              className="fill-primary/40"
            />
          </motion.g>
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2.5, delay: 1.8, repeat: Infinity }}
          >
            <path
              d="M 210,70 L 212,75 L 217,75 L 213,78 L 215,83 L 210,80 L 205,83 L 207,78 L 203,75 L 208,75 Z"
              className="fill-secondary/40"
            />
          </motion.g>
        </svg>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="text-center max-w-md"
      >
        <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
          {title}
        </h3>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
          {description}
        </p>

        {/* CTA Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            className="text-base px-8 shadow-lg hover:shadow-xl transition-shadow"
            asChild
          >
            <Link href={ctaHref}>
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
              {ctaText}
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Decorative bottom element */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="mt-12 flex items-center gap-6 text-zinc-400 dark:text-zinc-600"
      >
        <div className="flex items-center gap-2">
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
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="text-sm">Explore</span>
        </div>
        <div className="flex items-center gap-2">
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-sm">Plan</span>
        </div>
        <div className="flex items-center gap-2">
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
            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
            <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
            <path d="M12 3v6" />
          </svg>
          <span className="text-sm">Travel</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
