import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Forgot Password | TripYojana",
  description: "Reset your TripYojana account password",
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
