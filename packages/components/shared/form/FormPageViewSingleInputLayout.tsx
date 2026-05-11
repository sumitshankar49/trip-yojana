import type React from "react";
import { cn } from "@/packages/lib/utils";

export interface FormPageViewSingleInputLayoutProps {
  children: React.ReactNode;
  height?: string;
}

export function FormPageViewSingleInputLayout({
  children,
  height,
}: FormPageViewSingleInputLayoutProps) {
  const heightClass = height || "max-h-[calc(100dvh-14.5rem)]";

  return (
    <div className={cn(heightClass, "mb-2 overflow-auto py-1")}>
      <div className="grid grid-cols-1 gap-2">{children}</div>
    </div>
  );
}