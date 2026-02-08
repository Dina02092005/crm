"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { CustomersTable } from "@/components/dashboard/CustomersTable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function CustomersPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    const fetchCustomers = async () => {
        try {
            const params = new URLSearchParams({
                search,
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            const response = await axios.get(`/api/customers?${params}`);
            setCustomers(response.data.customers);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error("Failed to fetch customers");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCustomer = async (e: any) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            phone: formData.get("phone"),
        };

        try {
            await axios.post("/api/customers", data);
            toast.success("Customer created successfully");
            setShowCreateDialog(false);
            fetchCustomers();
            e.target.reset();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to create customer");
        }
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDeleteCustomer = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`/api/customers/${deleteId}`);
            toast.success("Customer deleted successfully");
            fetchCustomers();
        } catch (error) {
            toast.error("Failed to delete customer");
        } finally {
            setDeleteId(null);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [search, pagination.page]);

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
        <div className="p-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Users className="h-8 w-8 text-teal-600" />
                        Customers
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your customer database</p>
                </div>
                <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-teal-600 hover:bg-teal-700 rounded-xl"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                </Button>
            </div>

            {/* Search Bar */}
            <Card className="mb-6 border-0 rounded-3xl">
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Search by name, email, or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 bg-white border-gray-200 rounded-2xl h-12"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Customers Table */}
            <Card className="border-0 rounded-3xl overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-100">
                    <CardTitle className="text-lg font-bold text-gray-800">
                        {pagination.total} Customers
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <CustomersTable
                        data={customers}
                        onUpdate={fetchCustomers}
                        onDelete={handleDeleteCustomer}
                    />
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                        variant="outline"
                        disabled={pagination.page === 1}
                        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        className="rounded-xl"
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                        className="rounded-xl"
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Create Customer Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCustomer}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" name="name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone *</Label>
                                <Input id="phone" name="phone" required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                                Create Customer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Customer"
                description="Are you sure you want to delete this customer? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
        </div >
    );
}
