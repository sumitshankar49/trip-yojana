import { Badge } from "@/packages/components/ui/badge";
import { PlaceCard } from "./PlaceCard";
import type { PlacesListProps } from "../types";
import { CATEGORY_COLORS } from "../constants";

export function PlacesList({
  places,
  selectedPlace,
  onSelectPlace,
  onRemovePlace,
}: PlacesListProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 sm:text-xl">
            Trip Locations
          </h2>
          <Badge variant="secondary" className="shrink-0">{places.length}</Badge>
        </div>

        <div className="space-y-3">
          {places.length === 0 ? (
            <div className="py-10 text-center sm:py-12">
              <svg
                className="mx-auto mb-4 h-14 w-14 text-zinc-300 dark:text-zinc-600 sm:h-16 sm:w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No places added yet
              </p>
            </div>
          ) : (
            places.map((place, index) => (
              <PlaceCard
                key={place.id}
                place={place}
                index={index}
                isSelected={selectedPlace?.id === place.id}
                onSelect={onSelectPlace}
                onRemove={onRemovePlace}
              />
            ))
          )}
        </div>

        {/* Categories Legend */}
        {places.length > 0 && (
          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
              Categories
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
                <div key={category} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 capitalize">
                    {category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
