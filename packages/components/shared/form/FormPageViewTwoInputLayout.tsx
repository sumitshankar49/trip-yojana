import type React from "react";
import { cn } from "@/packages/lib/utils";

export function FormPageViewTwoInputLayout({
  children,
  isWithStepper = false,
  height,
}: {
  children: React.ReactNode;
  isWithStepper?: boolean;
  height?: string;
}) {
  const heightClass = height || (isWithStepper ? "h-[50dvh]" : "h-[55dvh]");

  return (
    <div className={cn(heightClass, "mb-1 overflow-auto py-1")}>
      <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2">
        {children}
      </div>
    </div>
  );
}