import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | TripYojana",
  description: "View and manage all your trips in one place",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
