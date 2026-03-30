"use client";

import { signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useAuth() {
  const router = useRouter();

  const signOut = async () => {
    try {
      await nextAuthSignOut({ redirect: false });
      toast.success("Logged out successfully");
      router.push("/auth");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  return {
    signOut,
  };
}
