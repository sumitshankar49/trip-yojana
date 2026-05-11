"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/packages/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/packages/components/ui/dialog";

type ConfirmationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isConfirming?: boolean;
};

export default function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  isConfirming = false,
}: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isConfirming} className="gap-2">
            {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isConfirming ? "Deleting..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
