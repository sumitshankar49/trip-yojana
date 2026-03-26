import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trip Map | TripYojana",
  description: "View your trip on an interactive map",
};

export default function MapLayout({ children }: { children: ReactNode }) {
  return children;
}
