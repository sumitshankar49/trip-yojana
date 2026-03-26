export interface TripFormData {
  destination: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  groupSize: number;
  budget: number;
  travelType: string;
}

export type Step = 1 | 2 | 3;

export interface TripFormErrors {
  destination?: string;
  startDate?: string;
  endDate?: string;
  groupSize?: string;
  budget?: string;
  travelType?: string;
}
