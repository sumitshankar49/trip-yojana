export interface Activity {
  id: string;
  title: string;
  time: string;
  location: string;
  description: string;
  icon: string;
}

export interface Day {
  id: string;
  date: string;
  activities: Activity[];
}

export interface ActivityCardProps {
  activity: Activity;
  dayId: string;
}
