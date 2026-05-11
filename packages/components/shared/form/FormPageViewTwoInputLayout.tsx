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
  const heightClass = height || (isWithStepper ? "h-auto min-h-[9.5rem]" : "h-fit");

  return (
    <div className={cn(heightClass, "mb-2 py-1")}> 
      <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2">
        {children}
      </div>
    </div>
  );
}