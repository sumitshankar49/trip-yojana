import { Card, CardContent } from "@/packages/components/ui/card";
import { Badge } from "@/packages/components/ui/badge";
import type { SelectedPlaceOverlayProps } from "../types";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "../constants";

export function SelectedPlaceOverlay({ place, onClose }: SelectedPlaceOverlayProps) {
  return (
    <Card className="absolute bottom-4 left-4 right-4 z-1000 shadow-xl bg-white/95 backdrop-blur-sm pointer-events-auto dark:bg-zinc-900/95 md:bottom-auto md:left-auto md:right-4 md:top-4 md:max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="pr-3 font-bold text-base md:text-lg text-zinc-900 dark:text-zinc-50">
            {place.name}
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          {place.description}
        </p>
        {place.address && (
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
            📍 {place.address}
          </p>
        )}
        {place.time && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            🕐 {place.time}
          </p>
        )}
        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <Badge style={{ backgroundColor: CATEGORY_COLORS[place.category] }}>
            {CATEGORY_ICONS[place.category]} {place.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
