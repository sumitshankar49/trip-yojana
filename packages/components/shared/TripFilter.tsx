"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/packages/components/ui/select";

export interface TripOption {
  id: string;
  destination: string;
}

interface TripFilterProps {
  selectedTripId: string;
  onTripChange: (tripId: string) => void;
  trips: TripOption[];
  isLoading?: boolean;
  className?: string;
}

export function TripFilter({
  selectedTripId,
  onTripChange,
  trips,
  isLoading,
  className,
}: TripFilterProps) {
  return (
    <Select value={selectedTripId} onValueChange={onTripChange} disabled={isLoading || trips.length === 0}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
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
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <SelectValue placeholder={isLoading ? "Loading trips..." : "Select a trip"} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {trips.map((trip) => (
          <SelectItem key={trip.id} value={trip.id}>
            {trip.destination}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
