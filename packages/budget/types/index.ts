export type ApiTrip = {
  _id: string;
  title: string;
  budget: number;
  places?: string[];
  startDate: string;
  endDate: string;
};
