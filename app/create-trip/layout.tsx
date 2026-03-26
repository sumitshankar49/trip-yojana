import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Trip | TripYojana",
  description: "Plan your next adventure",
};

export default function CreateTripLayout({ children }: { children: ReactNode }) {
  return children;
}
