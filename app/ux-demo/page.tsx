"use client";

import { useState } from "react";
import { Button } from "@/packages/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/components/ui/card";
import { Label } from "@/packages/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/packages/components/ui/tooltip";
import { ConfirmDialog, useConfirmDialog } from "@/packages/components/shared/ConfirmDialog";
import { toast, commonToasts, toastAsync } from "@/packages/lib/toast";
import {
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  TableSkeleton,
  ListSkeleton,
  FormSkeleton,
} from "@/packages/components/ui/skeleton";

export default function UXEnhancementsDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  // Toast examples
  const handleToastExamples = () => {
    // Basic toasts
    toast.success("Operation successful!");
    
    setTimeout(() => {
      toast.error("Something went wrong");
    }, 1000);

    setTimeout(() => {
      toast.info("Here's some information");
    }, 2000);

    setTimeout(() => {
      toast.warning("Please be careful!");
    }, 3000);
  };

  // Common toasts
  const handleCommonToasts = () => {
    commonToasts.tripCreated();
    
    setTimeout(() => {
      commonToasts.expenseAdded();
    }, 1000);

    setTimeout(() => {
      commonToasts.budgetNearLimit(85);
    }, 2000);
  };

  // Promise toast
  const handlePromiseToast = () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve({ data: "Success!" });
        } else {
          reject("Failed!");
        }
      }, 2000);
    });

    toast.promise(promise, {
      loading: "Creating trip...",
      success: "Trip created successfully! 🎉",
      error: "Failed to create trip",
    });
  };

  // Async operation with toast
  const handleAsyncOperation = async () => {
    try {
      await toastAsync(
        async () => {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return { success: true };
        },
        {
          loading: "Saving changes...",
          success: "Changes saved successfully!",
          error: "Failed to save changes",
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  // Confirmation dialog examples
  const handleDeleteWithDialog = () => {
    setShowDialog(true);
  };

  const handleDeleteWithHook = async () => {
    await confirm({
      title: "Delete Trip?",
      description: "This action cannot be undone. All trip data will be permanently deleted.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
      onConfirm: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast.success("Trip deleted successfully");
      },
    });
  };

  const handleWarningDialog = async () => {
    await confirm({
      title: "Budget Exceeded",
      description: "Your expenses have exceeded the planned budget. Do you want to continue?",
      confirmText: "Continue",
      cancelText: "Cancel",
      variant: "warning",
      onConfirm: async () => {
        toast.info("Continuing with exceeded budget");
      },
    });
  };

  // Loading skeleton example
  const handleToggleLoading = () => {
    setIsLoading(!isLoading);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            UX Enhancements Demo
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Explore toast notifications, loading skeletons, tooltips, and confirmation dialogs
          </p>
        </div>

        {/* Toast Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Toast Notifications</CardTitle>
            <CardDescription>
              Beautiful toast messages for user feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleToastExamples}>
                Show All Toast Types
              </Button>
              <Button onClick={handleCommonToasts} variant="outline">
                Common Toasts
              </Button>
              <Button onClick={handlePromiseToast} variant="outline">
                Promise Toast
              </Button>
              <Button onClick={handleAsyncOperation} variant="outline">
                Async Operation
              </Button>
              <Button onClick={() => commonToasts.copied()} variant="outline">
                Copy Success
              </Button>
            </div>

            {/* Code example */}
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg">
              <code className="text-sm">
                {`import { toast, commonToasts } from "@/packages/lib/toast";

// Simple usage
toast.success("Operation successful!");
toast.error("Something went wrong");
toast.info("FYI: Here's some info");
toast.warning("Be careful!");

// Pre-configured toasts
commonToasts.tripCreated();
commonToasts.expenseAdded();
commonToasts.budgetExceeded();`}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialogs */}
        <Card>
          <CardHeader>
            <CardTitle>Confirmation Dialogs</CardTitle>
            <CardDescription>
              Get user confirmation before critical actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDeleteWithDialog} variant="outline">
                Delete (Component)
              </Button>
              <Button onClick={handleDeleteWithHook} variant="outline">
                Delete (Hook)
              </Button>
              <Button onClick={handleWarningDialog} variant="outline">
                Warning Dialog
              </Button>
            </div>

            {/* Code example */}
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg">
              <code className="text-sm">
                {`import { useConfirmDialog } from "@/packages/components/shared/ConfirmDialog";

const { confirm, ConfirmDialogComponent } = useConfirmDialog();

// Show confirmation
await confirm({
  title: "Delete Trip?",
  description: "This cannot be undone.",
  confirmText: "Delete",
  variant: "danger",
  onConfirm: async () => {
    // Delete logic
  },
});

// Render component
return <>{ConfirmDialogComponent}</>;`}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Loading Skeletons */}
        <Card>
          <CardHeader>
            <CardTitle>Loading Skeletons</CardTitle>
            <CardDescription>
              Smooth loading states while content is being fetched
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button onClick={handleToggleLoading}>
              Toggle Loading State
            </Button>

            {isLoading ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Text Skeleton</h3>
                  <SkeletonText lines={3} />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Avatar Skeleton</h3>
                  <div className="flex gap-2">
                    <SkeletonAvatar size="sm" />
                    <SkeletonAvatar size="md" />
                    <SkeletonAvatar size="lg" />
                    <SkeletonAvatar size="xl" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Button Skeleton</h3>
                  <div className="flex gap-2">
                    <SkeletonButton />
                    <SkeletonButton className="w-32" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Table Skeleton</h3>
                  <TableSkeleton rows={3} columns={4} />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">List Skeleton</h3>
                  <ListSkeleton items={3} />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Form Skeleton</h3>
                  <FormSkeleton />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500">
                Click the button above to see loading skeletons
              </div>
            )}

            {/* Code example */}
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg">
              <code className="text-sm">
                {`import { 
  SkeletonText, 
  SkeletonAvatar, 
  TableSkeleton,
  ListSkeleton,
  FormSkeleton 
} from "@/packages/components/ui/skeleton";

{isLoading ? (
  <>
    <SkeletonText lines={3} />
    <SkeletonAvatar size="lg" />
    <TableSkeleton rows={5} columns={4} />
  </>
) : (
  <YourContent />
)}`}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Tooltips */}
        <Card>
          <CardHeader>
            <CardTitle>Tooltips</CardTitle>
            <CardDescription>
              Helpful hints on hover
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button>Hover me</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a tooltip!</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Get help and support</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border">
                    <Label>Trip Budget</Label>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 text-zinc-400"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The total budget allocated for this trip</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Code example */}
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg">
              <code className="text-sm">
                {`import { Tooltip, TooltipContent, TooltipTrigger } from "@/packages/components/ui/tooltip";

<Tooltip>
  <TooltipTrigger asChild>
    <Button>Hover me</Button>
  </TooltipTrigger>
  <TooltipContent>
    <p>This is a tooltip!</p>
  </TooltipContent>
</Tooltip>`}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Delete Trip?"
        description="This action cannot be undone. All trip data including itinerary, expenses, and bookings will be permanently deleted."
        confirmText="Delete Trip"
        cancelText="Cancel"
        variant="danger"
        onConfirm={async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          toast.success("Trip deleted successfully");
        }}
      />

      {ConfirmDialogComponent}
    </div>
  );
}
