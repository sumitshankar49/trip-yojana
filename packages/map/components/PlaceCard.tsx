import { Card, CardContent } from "@/packages/components/ui/card";
import type { PlaceCardProps } from "../types";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "../constants";

export function PlaceCard({
  place,
  index,
  isSelected,
  onSelect,
  onRemove,
}: PlaceCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-blue-500 shadow-md" : ""
      }`}
      onClick={() => onSelect(place)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Number Badge */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm"
            style={{
              backgroundColor: CATEGORY_COLORS[place.category],
            }}
          >
            {index + 1}
          </div>

          {/* Place Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-base leading-tight">
                {place.name}
              </h3>
              <div className="flex gap-1 shrink-0">
                <span className="text-sm">{CATEGORY_ICONS[place.category]}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(place.id);
                  }}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  aria-label="Remove place"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-1.5">
              {place.description}
            </p>
            {place.time && (
              <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1.5">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{place.time}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
