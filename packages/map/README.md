# Map Package

Interactive map feature for Trip Yojana using Leaflet.

## Structure

```
packages/map/
├── components/           # React components
│   ├── index.tsx        # MapComponent (main map with Leaflet)
│   ├── PlaceCard.tsx    # Individual place card
│   ├── PlacesList.tsx   # Left sidebar with places list
│   └── SelectedPlaceOverlay.tsx  # Overlay showing selected place details
├── constants/           # Constants and configuration
│   └── index.ts         # CATEGORY_COLORS, CATEGORY_ICONS, MAP_DEFAULTS, INITIAL_PLACES
├── helpers/             # Utility functions
│   └── index.ts         # Map calculations (distance, bounds, center)
├── hooks/               # Custom React hooks
│   └── index.ts         # useMapData - localStorage management
├── types/               # TypeScript interfaces
│   └── index.ts         # Place, PlaceCategory, component props
├── validations/         # Validation schemas (future)
└── page.tsx             # Main map page component
```

## Features

- ✅ Interactive Leaflet map with OpenStreetMap tiles
- ✅ Custom numbered markers for places
- ✅ Route visualization with polyline
- ✅ Auto-fit bounds to show all places
- ✅ Intelligent centering (India vs World)
- ✅ Places list sidebar with search & filter
- ✅ Selected place overlay
- ✅ LocalStorage persistence
- ✅ Backward compatibility with old coordinate format

## Usage

```tsx
import { MapComponent } from "@/packages/map/components";
import { useMapData } from "@/packages/map/hooks";

function MyPage() {
  const { places, selectedPlace, setSelectedPlace } = useMapData();
  
  return <MapComponent places={places} />;
}
```

## Types

### Place
```typescript
interface Place {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: "attraction" | "restaurant" | "hotel" | "activity";
  time?: string;
  address?: string;
}
```

## Constants

- **CATEGORY_COLORS**: Color mapping for each place category
- **CATEGORY_ICONS**: Emoji icons for each place category
- **MAP_DEFAULTS**: Default map configuration (centers, zoom levels, bounds)
- **INITIAL_PLACES**: Sample places data (Popular Indian temples across multiple cities)

## Hooks

### useMapData()

Custom hook for managing map data with localStorage persistence.

**Returns:**
- `places`: Array of places
- `selectedPlace`: Currently selected place
- `setSelectedPlace`: Function to set selected place
- `removePlace`: Function to remove a place
- `addPlace`: Function to add a place
- `updatePlace`: Function to update a place

## Helpers

- `getMapCenter(places)`: Calculate optimal map center
- `calculateBounds(places)`: Calculate map bounds from places
- `calculateDistance(lat1, lng1, lat2, lng2)`: Haversine distance calculation
- `calculateTotalDistance(places)`: Total route distance
- `formatDistance(km)`: Format distance for display

## Dependencies

- `leaflet`: ^1.9.4
- `react-leaflet`: Latest
- `@types/leaflet`: ^1.9.21

## Notes

- Map component is dynamically imported to avoid SSR issues
- Leaflet CSS and icon fix are imported in components/index.tsx
- Uses custom divIcon for numbered markers
- Supports both India-specific and world-wide trips
