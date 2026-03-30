"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/packages/lib/utils";

interface AuthLoadingProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * AuthLoading component for showing loading state during authentication
 * 
 * Features:
 * - Centered loading spinner
 * - Optional custom message
 * - Full screen or inline mode
 * - Prevents content flicker during auth checks
 * 
 * Usage:
 * ```tsx
 * <AuthLoading message="Verifying your session..." />
 * <AuthLoading fullScreen={false} /> // Inline mode
 * ```
 */
export default function AuthLoading({ 
  message = "Loading...", 
  fullScreen = true,
  className 
}: AuthLoadingProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen && "min-h-screen",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
