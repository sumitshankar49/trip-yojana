export interface Trip {
  id: string;
  title: string;
  source?: string;
  sourcePincode?: string;
  sourceState?: string;
  sourceCountry?: string;
  destination: string;
  destinationPincode?: string;
  destinationState?: string;
  destinationCountry?: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  travelType?: string;
}
