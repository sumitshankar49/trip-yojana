"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * ProtectedRoute component for client-side route protection
 * 
 * Features:
 * - Checks authentication status using useSession
 * - Shows loading state while verifying session
 * - Redirects unauthenticated users to auth page
 * - Prevents content flicker with loading state
 * 
 * Usage:
 * ```tsx
 * <ProtectedRoute>
 *   <YourProtectedContent />
 * </ProtectedRoute>
 * ```
 */
export default function ProtectedRoute({ 
  children, 
  redirectTo = "/auth" 
}: ProtectedRouteProps) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated and session check is complete
    if (status === "unauthenticated") {
      router.push(redirectTo);
    }
  }, [status, router, redirectTo]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children until authentication is confirmed
  if (status === "unauthenticated") {
    return null;
  }

  // Render protected content only when authenticated
  return <>{children}</>;
}
