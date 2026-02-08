"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { CreateEmployeeDialog } from "@/components/dashboard/CreateEmployeeDialog";
import { useEmployees, useDeleteEmployee, useToggleEmployeeStatus } from "@/hooks/use-employees";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeesPage() {
    const { data: session } = useSession() as any;
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [createSheetOpen, setCreateSheetOpen] = useState(false);

    // Query Hook
    const { data: employees = [], isLoading } = useEmployees(statusFilter);

    // Mutations
    const deleteEmployeeMutation = useDeleteEmployee();
    const toggleEmployeeStatusMutation = useToggleEmployeeStatus();

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [statusId, setStatusId] = useState<string | null>(null);
    const [currentStatus, setCurrentStatus] = useState<boolean>(false);

    // Filter employees locally for search
    const filteredEmployees = employees.filter((emp: any) =>
    (emp.name?.toLowerCase().includes(search.toLowerCase()) ||
        emp.email?.toLowerCase().includes(search.toLowerCase()) ||
        emp.role?.toLowerCase().includes(search.toLowerCase()))
    );

    const handleToggleStatus = (id: string, status: boolean) => {
        setStatusId(id);
        setCurrentStatus(status);
    };

    const confirmStatusChange = async () => {
        if (!statusId) return;
        try {
            await toggleEmployeeStatusMutation.mutateAsync({ id: statusId, isActive: !currentStatus });
            toast.success(`Employee ${currentStatus ? 'deactivated' : 'activated'} successfully`);
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
            await deleteEmployeeMutation.mutateAsync(deleteId);
            toast.success("Employee deleted successfully");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to delete employee");
        } finally {
            setDeleteId(null);
        }
    };

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

    return (
        <div className="p-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        Employees
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your team members</p>
                </div>
                {session?.user?.role === "ADMIN" && (
                    <CreateEmployeeDialog onEmployeeCreated={() => { }} />
                )}
            </div>

            {/* Search and Filters */}
            <Card className="mb-6 border-0 rounded-3xl bg-card">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 bg-background border-input rounded-2xl h-12"
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-12 rounded-2xl bg-muted/50 border-input">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Employees</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Employees Table */}
            <Card className="border-0 rounded-3xl overflow-hidden bg-card">
                <CardHeader className="bg-card border-b border-border">
                    <CardTitle className="text-lg font-bold text-foreground">
                        {filteredEmployees.length} Employees
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 space-y-4">
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                    ) : (
                        <EmployeesTable
                            data={filteredEmployees}
                            onUpdate={() => { }} // Hook handles updates
                            onDelete={handleDeleteEmployee}
                            onToggleStatus={handleToggleStatus}
                        />
                    )}
                </CardContent>
            </Card>

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
