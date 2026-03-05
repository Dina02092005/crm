"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EmployeesTable } from "@/components/dashboard/EmployeesTable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateEmployeeSheet } from "@/components/dashboard/CreateEmployeeSheet";
import { useEmployees, useDeleteEmployee, useToggleEmployeeStatus, useEmployeeStats } from "@/hooks/use-employees";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";

export default function CounselorsPage() {
    const { data: session } = useSession() as any;
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Filter reset on change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter]);

    // Query Hook
    const { data, isLoading } = useEmployees(statusFilter, page, limit, "COUNSELOR", debouncedSearch);

    const employees = data?.employees || [];
    const pagination = data?.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 };

    // Mutations
    const deleteEmployeeMutation = useDeleteEmployee();
    const toggleEmployeeStatusMutation = useToggleEmployeeStatus();
    const { data: employeeStats } = useEmployeeStats("COUNSELOR");

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
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "AGENT") {
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

    const getCount = (id: string) => {
        if (!employeeStats) return 0;
        if (id === 'all') return employeeStats.total;
        if (id === 'active') return employeeStats.active;
        if (id === 'inactive') return employeeStats.inactive;
        return 0;
    };

    return (
        <div className="flex flex-col gap-2 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 px-1">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Counselors Management</h1>
            </div>

            <Card className="border-0 rounded-3xl overflow-hidden bg-card shadow-sm border-gray-100">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50/50 shadow-none focus:bg-white transition-all text-sm"
                            />
                        </div>
                        {(session?.user?.role === "ADMIN" || session?.user?.role === "AGENT") && (
                            <CreateEmployeeSheet
                                onEmployeeCreated={() => { }}
                                defaultRole="COUNSELOR"
                                title="Counselor"
                            />
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {[
                            { id: "all", label: "Total", color: "text-blue-600", bg: "bg-blue-50" },
                            { id: "active", label: "Active", color: "text-emerald-600", bg: "bg-emerald-50" },
                            { id: "inactive", label: "Inactive", color: "text-gray-600", bg: "bg-gray-50" },
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setStatusFilter(f.id)}
                                className={`
                                    px-4 py-2 rounded-xl flex items-center gap-2 transition-all border font-bold text-xs
                                    ${statusFilter === f.id
                                        ? `${f.bg} ${f.color} border-current shadow-sm`
                                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                                    }
                                `}
                            >
                                {f.label}
                                <span className={`opacity-60`}>
                                    ({getCount(f.id)})
                                </span>
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-gray-500 font-medium">Loading counselors...</p>
                        </div>
                    ) : (
                        <EmployeesTable
                            data={employees}
                            onUpdate={() => { }}
                            onDelete={handleDeleteEmployee}
                            onToggleStatus={handleToggleStatus}
                            title="Counselor"
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
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Counselor"
                description="Are you sure you want to delete this counselor? This will unassign all their leads. This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />

            <ConfirmDialog
                isOpen={!!statusId}
                onClose={() => setStatusId(null)}
                onConfirm={confirmStatusChange}
                title={currentStatus ? "Deactivate Counselor" : "Activate Counselor"}
                description={
                    currentStatus
                        ? "Are you sure you want to deactivate this counselor? They will no longer be able to log in, but their history will be preserved."
                        : "Are you sure you want to activate this counselor? They will regain access to the system."
                }
                confirmText={currentStatus ? "Deactivate" : "Activate"}
                variant={currentStatus ? "destructive" : "default"}
            />
        </div>
    );
}
