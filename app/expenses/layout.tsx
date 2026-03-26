import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expenses | TripYojana",
  description: "Manage group expenses and settlements",
};

export default function ExpensesLayout({ children }: { children: ReactNode }) {
  return children;
}
