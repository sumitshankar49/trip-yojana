export interface Place {
  id: string;
  name: string;
  coordinates: [number, number];
  description: string;
  icon: string;
}

export interface MapState {
  selectedPlace: Place | null;
  isPanelCollapsed: boolean;
}
