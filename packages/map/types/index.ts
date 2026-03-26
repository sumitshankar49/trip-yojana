export interface Place {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: "attraction" | "restaurant" | "hotel" | "activity";
  time?: string;
  address?: string;
}

export type PlaceCategory = Place["category"];

export interface MapComponentProps {
  places: Place[];
  focusPlace?: string | null;
}

export interface PlaceCardProps {
  place: Place;
  index: number;
  isSelected: boolean;
  onSelect: (place: Place) => void;
  onRemove: (placeId: string) => void;
}

export interface PlacesListProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onRemovePlace: (placeId: string) => void;
}

export interface SelectedPlaceOverlayProps {
  place: Place;
  onClose: () => void;
}
