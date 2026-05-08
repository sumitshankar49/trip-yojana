interface Activity {
  id: string;
  title: string;
  time: string;
  cost: number;
}

interface Day {
  id: number;
  date: string;
  activities: Activity[];
}

// DEPRECATED: Trip itineraries are now stored in the database
// Use the Itinerary API endpoints (/api/itineraries) instead
export const TRIP_ITINERARIES: Record<string, Day[]> = {};
