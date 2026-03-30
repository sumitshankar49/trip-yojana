import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Settings | TripYojana",
  description: "Manage your account settings and profile information",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
