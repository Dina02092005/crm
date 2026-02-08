"use client"

import { useState } from "react";
import { useDrivers, useDeleteDriver } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import DriverForm from "@/components/forms/DriverForm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DriversTable } from "@/components/dashboard/DriversTable";

export default function DriversListPage() {
    const { data: drivers, isLoading, isError, refetch } = useDrivers();
    const deleteMutation = useDeleteDriver();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    const handleSheetClose = () => {
        setIsSheetOpen(false);
        refetch(); // Refetch data after update or create
    };

    if (isError) {
        return <div>Error loading drivers. Please check if the backend is running.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Driver
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col gap-0 p-0 overflow-y-auto">
                        <div className="p-6">
                            <SheetHeader>
                                <SheetTitle>Add New Driver</SheetTitle>
                                <SheetDescription>
                                    Enter driver details below.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6">
                                <DriverForm
                                    onSuccess={handleSheetClose}
                                    formId="driver-form"
                                />
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <DriversTable
                    data={drivers || []}
                    onUpdate={refetch}
                    onDelete={handleDelete}
                />
            )}

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Driver"
                description="Are you sure you want to delete this driver? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    );
}
