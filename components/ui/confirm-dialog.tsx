"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    isLoading = false,
}: ConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl p-0 overflow-hidden ring-1 ring-border/50 bg-background">
                <DialogHeader className="p-6 border-b border-border/50 bg-muted/40">
                    <DialogTitle className="text-xl font-bold tracking-tight text-foreground">{title}</DialogTitle>
                    <DialogDescription className="text-sm font-medium text-muted-foreground mt-2">{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="p-4 bg-muted/20 flex flex-row items-center justify-end gap-3 sm:gap-4">
                    <Button 
                        variant="ghost" 
                        onClick={onClose} 
                        disabled={isLoading}
                        className="rounded-xl px-6 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "rounded-xl px-8 h-11 text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-primary/20",
                            variant === "destructive" ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20" : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
                        )}
                    >
                        {isLoading ? (
                             <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                             </div>
                        ) : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
