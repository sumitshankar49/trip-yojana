"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Custom hook for authentication with automatic redirect
 * 
 * Features:
 * - Returns session data and status
 * - Automatically redirects unauthenticated users
 * - Simplifies protected page implementation
 * 
 * Usage:
 * ```tsx
 * const { session, status, isAuthenticated } = useAuth();
 * 
 * if (status === "loading") return <LoadingSpinner />;
 * ```
 */
export function useAuth(redirectTo = "/auth") {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(redirectTo);
    }
  }, [status, router, redirectTo]);

  return {
    session,
    status,
    isAuthenticated,
    isLoading: status === "loading",
    user: session?.user,
  };
}
