import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Itinerary | TripYojana",
  description: "Plan your daily activities",
};

export default function ItineraryLayout({ children }: { children: ReactNode }) {
  return children;
}
