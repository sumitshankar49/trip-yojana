import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Budget Tracker | TripYojana",
  description: "Track your trip expenses and manage your budget",
};

export default function BudgetLayout({ children }: { children: ReactNode }) {
  return children;
}
