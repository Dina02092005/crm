"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { CustomersTable } from "@/components/dashboard/CustomersTable";
import CustomerForm from "@/components/forms/CustomerForm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCustomers } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/use-debounce";

export default function CustomersPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [search, setSearch] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useCustomers(page, limit);

    // Reset page on search changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const customers = data?.customers || [];
    const pagination = data?.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 };

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDeleteCustomer = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`/api/customers/${deleteId}`);
            toast.success("Customer deleted successfully");
            refetch();
        } catch (error) {
            toast.error("Failed to delete customer");
        } finally {
            setDeleteId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="p-10">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 p-3 sm:p-4">
            <Card className="border-0 rounded-3xl overflow-hidden bg-card">
                <CardContent className="p-4">
                    {/* Integrated Search and Action Row */}
                    <div className="flex flex-row items-center justify-between mb-2 gap-4">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                            <Input
                                placeholder="Search customers..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-[13px] placeholder:text-muted-foreground/40 font-sans w-full"
                            />
                        </div>
                        <Button
                            onClick={() => setShowCreateDialog(true)}
                            className="bg-primary hover:bg-primary/90 text-white rounded-xl h-9 px-6 transition-colors shadow-sm font-medium"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Customer
                        </Button>
                    </div>

                    <CustomersTable
                        data={customers}
                        onUpdate={refetch}
                        onDelete={handleDeleteCustomer}
                        pagination={{
                            page: pagination.page,
                            totalPages: pagination.totalPages,
                            pageSize: limit,
                            onPageChange: setPage,
                            onPageSizeChange: (newLimit) => {
                                setLimit(newLimit);
                                setPage(1);
                            }
                        }}
                    />
                </CardContent>
            </Card>

            <Sheet open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <SheetContent className="overflow-y-auto w-full sm:max-w-md flex flex-col p-0">
                    <div className="p-6 pb-2">
                        <SheetHeader>
                            <SheetTitle>Add New Customer</SheetTitle>
                            <SheetDescription>
                                Enter customer details to create a new record.
                            </SheetDescription>
                        </SheetHeader>
                    </div>
                    <div className="flex-1 px-6">
                        <CustomerForm
                            formId="create-customer-form"
                            onSuccess={() => {
                                setShowCreateDialog(false);
                                refetch();
                                toast.success("Customer created successfully");
                            }}
                        />
                    </div>
                    <div className="p-6 pt-2 mt-auto border-t">
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" form="create-customer-form" className="bg-primary hover:bg-primary/90 text-white">
                                Create Customer
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Customer"
                description="Are you sure you want to delete this customer? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    );
}
