"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmployeesTable } from "@/components/dashboard/EmployeesTable";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import EmployeeForm from "@/components/forms/EmployeeForm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function EmployeesPage() {
    const router = useRouter();
    const { data: session } = useSession() as any;
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("active");
    const [createSheetOpen, setCreateSheetOpen] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    const fetchEmployees = async () => {
        try {
            const params = new URLSearchParams({
                search,
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                status: statusFilter,
                ...(roleFilter !== "ALL" && { role: roleFilter }),
            });

            const response = await axios.get(`/api/employees?${params}`);
            setEmployees(response.data.employees);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error("Failed to fetch employees");
        } finally {
            setIsLoading(false);
        }
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [statusId, setStatusId] = useState<string | null>(null);
    const [currentStatus, setCurrentStatus] = useState<boolean>(false);

    const handleToggleStatus = (id: string, status: boolean) => {
        setStatusId(id);
        setCurrentStatus(status);
    };

    const confirmStatusChange = async () => {
        if (!statusId) return;
        try {
            await axios.patch(`/api/employees/${statusId}`, { isActive: !currentStatus });
            toast.success(`Employee ${currentStatus ? 'deactivated' : 'activated'} successfully`);
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to update employee status");
        } finally {
            setStatusId(null);
        }
    };

    const handleDeleteEmployee = (employeeId: string) => {
        setDeleteId(employeeId);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`/api/employees/${deleteId}`);
            toast.success("Employee deleted successfully");
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to delete employee");
        } finally {
            setDeleteId(null);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [search, roleFilter, statusFilter, pagination.page]);

    // Check if user has access
    if (session?.user?.role !== "ADMIN") {
        return (
            <div className="p-10">
                <Card className="border-0 rounded-3xl">
                    <CardContent className="p-16 text-center">
                        <p className="text-gray-500">You don't have permission to view this page.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                    <p className="text-gray-500 mt-1">Manage your team members</p>
                </div>
                {session?.user?.role === "ADMIN" && (
                    <Button
                        onClick={() => setCreateSheetOpen(true)}
                        className="bg-teal-600 hover:bg-teal-700 rounded-xl"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Employee
                    </Button>
                )}
            </div>

            {/* Search and Filters */}
            <Card className="mb-6 border-0 rounded-3xl">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative col-span-2">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 bg-white border-gray-200 rounded-2xl h-12"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="rounded-2xl">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Roles</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="MANAGER">Manager</SelectItem>
                                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="rounded-2xl">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="ALL">All</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Employees Table */}
            <Card className="border-0 rounded-3xl overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-100">
                    <CardTitle className="text-lg font-bold text-gray-800">
                        {pagination.total} Employees
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <EmployeesTable
                        data={employees}
                        onUpdate={fetchEmployees}
                        onDelete={handleDeleteEmployee}
                        onToggleStatus={handleToggleStatus}
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

            <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
                <SheetContent className="overflow-y-auto w-full sm:max-w-sm">
                    <SheetHeader>
                        <SheetTitle>Add New Employee</SheetTitle>
                        <SheetDescription>
                            Create a new employee account.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        <EmployeeForm
                            onSuccess={() => {
                                setCreateSheetOpen(false);
                                fetchEmployees();
                            }}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Employee"
                description="Are you sure you want to delete this employee? This will unassign all their leads. This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />

            <ConfirmDialog
                isOpen={!!statusId}
                onClose={() => setStatusId(null)}
                onConfirm={confirmStatusChange}
                title={currentStatus ? "Deactivate Employee" : "Activate Employee"}
                description={
                    currentStatus
                        ? "Are you sure you want to deactivate this employee? They will no longer be able to log in, but their history will be preserved."
                        : "Are you sure you want to activate this employee? They will regain access to the system."
                }
                confirmText={currentStatus ? "Deactivate" : "Activate"}
                variant={currentStatus ? "destructive" : "default"}
            />
        </div>
    );
}

