import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication | TripYojana",
  description: "Sign in or create an account to start planning your trips",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
