"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    Search,
    Plus,
    FileSpreadsheet,
    Trash2, 
    UserPlus, 
    FilterX,
    Users
} from "lucide-react";
import { toast } from "sonner";
import { StudentsTable } from "@/components/dashboard/StudentsTable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AssignApplicationsModal } from "@/components/applications/AssignApplicationsModal";
import { useStudents, useStudentStats } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/use-debounce";
import { useRolePath } from "@/hooks/use-role-path";
import { useCountries, useCounselors } from "@/hooks/use-masters";
import { Badge } from "@/components/ui/badge";
import { StatusTabs, StatusTab } from "@/components/dashboard/StatusTabs";
import { STATUS_CONFIG } from "@/lib/status-config";
import { StudentStatus } from "@/lib/enums";
import { DataTableFilters, FilterConfig } from "@/components/dashboard/DataTableFilters";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function StudentsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { prefixPath } = useRolePath();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [agentId, setAgentId] = useState("ALL");
    const [counselorId, setCounselorId] = useState("ALL");
    const [countryId, setCountryId] = useState("ALL");
    const [appIntake, setAppIntake] = useState("ALL");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useStudents(
        page,
        limit,
        debouncedSearch,
        status === "ALL" ? "" : status,
        "", // legacy onboardedBy
        "", // legacy interestedCountry
        "", // legacy intake
        agentId === "ALL" ? "" : agentId,
        counselorId === "ALL" ? "" : counselorId,
        countryId === "ALL" ? "" : countryId,
        appIntake === "ALL" ? "" : appIntake
    );

    const { data: stats } = useStudentStats();
    const { data: countries } = useCountries();
    const { data: counselors } = useCounselors();
    const counts = stats || { ALL: 0, NEW: 0, DOCUMENT_PENDING: 0, DOCUMENT_VERIFIED: 0, APPLICATION_SUBMITTED: 0 };

    const studentStatusTabs: StatusTab[] = [
        "ALL",
        ...Object.values(StudentStatus)
    ].map((key) => {
        const config = STATUS_CONFIG[key] || { 
            label: key.replace(/_/g, ' '), 
            color: "text-slate-600", 
            bg: "bg-slate-600/10" 
        };
        return {
            id: key,
            label: (
                <div className="flex items-center gap-2">
                    {config.label}
                    <Badge 
                        variant="secondary" 
                        className={cn(
                            "h-4 px-1 text-[10px] font-bold border-none", 
                            config.bg, 
                            config.color
                        )}
                    >
                        {counts[key] || 0}
                    </Badge>
                </div>
            ),
            color: config.color,
            bg: config.bg
        };
    });

    // Reset page on search/filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status, agentId, counselorId, countryId, appIntake]);

    const students = data?.students || [];
    const pagination = data?.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 };

    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            const response = await axios.get('/api/students/export', {
                params: { search: debouncedSearch, status: status === "ALL" ? "" : status },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `students_export_${new Date().toISOString()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Excel exported successfully");
        } catch (error) {
            toast.error("Failed to export Excel");
        } finally {
            setIsExporting(false);
        }
    };

    const handleBulkDelete = async () => {
        try {
            setIsBulkDeleting(true);
            await axios.delete('/api/students/bulk', { data: { ids: selectedIds } });
            toast.success(`${selectedIds.length} students deleted`);
            setSelectedIds([]);
            refetch();
        } catch (error) {
            toast.error("Failed to delete students");
        } finally {
            setIsBulkDeleting(false);
            setShowBulkDeleteConfirm(false);
        }
    };

    const handleDeleteStudent = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`/api/students/${deleteId}`);
            toast.success("Student deleted successfully");
            refetch();
        } catch (error) {
            toast.error("Failed to delete student");
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="flex flex-col gap-3 p-3 sm:p-4 bg-slate-50/50 dark:bg-transparent min-h-screen">
            {/* Header Section - Detached */}
            <div className="flex flex-col md:flex-row gap-4 mb-0 bg-white dark:bg-transparent p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <div className="flex items-center gap-3">
                     <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <Users className="h-5 w-5 text-indigo-600" />
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-foreground tracking-tight">Student Management</h2>
                        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Total {pagination.total} Students</p>
                     </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportExcel}
                        disabled={isExporting}
                        className="h-9 rounded-xl border-slate-200 hover:bg-slate-50 gap-2 text-[12px] font-bold"
                    >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        {isExporting ? "Exporting..." : "Excel"}
                    </Button>

                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAssignModal(true)}
                        disabled={selectedIds.length === 0}
                        className="h-9 rounded-xl border-slate-200 hover:bg-slate-50 gap-2 text-[12px] font-bold disabled:opacity-50"
                    >
                        <UserPlus className="h-4 w-4 text-blue-600" />
                        Assign
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkDeleteConfirm(true)}
                        disabled={selectedIds.length === 0}
                        className="h-9 rounded-xl border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 gap-2 text-[12px] font-bold disabled:opacity-50"
                    >
                        <Trash2 className="h-4 w-4 text-red-600" />
                        Delete
                    </Button>
                </div>
            </div>

            <Card className="border-0 dark:border dark:border-white/5 rounded-3xl overflow-hidden bg-white dark:bg-transparent shadow-sm dark:shadow-none">
                <CardContent className="p-4">
                    <DataTableFilters
                        onSearch={setSearch}
                        searchValue={search}
                        onClear={() => {
                            setSearch("");
                            setStatus("ALL");
                            setAgentId("ALL");
                            setCounselorId("ALL");
                            setCountryId("ALL");
                            setAppIntake("ALL");
                        }}
                        filters={[
                            {
                                key: "agentId",
                                label: "Agent",
                                type: "select",
                                options: counselors?.filter((e: any) => e.role === "AGENT").map((c: any) => ({ label: c.name, value: c.id })) || []
                            },
                            {
                                key: "counselorId",
                                label: "Counselor",
                                type: "select",
                                options: counselors?.filter((e: any) => e.role === "COUNSELOR").map((c: any) => ({ label: c.name, value: c.id })) || []
                            },
                            {
                                key: "countryId",
                                label: "Country",
                                type: "select",
                                options: countries?.countries?.map((c: any) => ({ label: c.name, value: c.id })) || []
                            },
                            {
                                key: "appIntake",
                                label: "Intake",
                                type: "select",
                                options: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => ({ label: `${m} 2024/25`, value: m }))
                            }
                        ]}
                        values={{
                            agentId,
                            counselorId,
                            countryId,
                            appIntake
                        }}
                        onFilterChange={(key, value) => {
                            if (key === "agentId") setAgentId(value);
                            if (key === "counselorId") setCounselorId(value);
                            if (key === "countryId") setCountryId(value);
                            if (key === "appIntake") setAppIntake(value);
                        }}
                    />

                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <StatusTabs 
                                tabs={studentStatusTabs} 
                                activeTab={status} 
                                onTabChange={setStatus} 
                            />
                        </div>

                        <div className="flex items-center gap-3">
                             <Badge variant="outline" className="h-9 px-4 rounded-xl border-slate-200 dark:border-white/10 bg-white/50 dark:bg-transparent font-bold text-slate-600 dark:text-gray-300 gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                {pagination.total} Records
                            </Badge>
                             <Link href={prefixPath("/students/new")}>
                                <Button className="h-9 px-4 gap-2 font-bold text-[12px] rounded-xl shadow-md">
                                    <Plus className="h-4 w-4" /> Add Student
                                </Button>
                            </Link>
                        </div>
                    </div>


                    {isLoading && page === 1 ? (
                        <div className="space-y-4 p-4">
                            <div className="h-10 bg-slate-50 dark:bg-white/5 animate-pulse rounded-xl w-full" />
                            <div className="h-40 bg-slate-50 dark:bg-white/5 animate-pulse rounded-xl w-full" />
                        </div>
                    ) : (
                        <StudentsTable
                            data={students}
                            onUpdate={refetch}
                            onDelete={handleDeleteStudent}
                            selectedIds={selectedIds}
                            onSelectionChange={setSelectedIds}
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

            {/* Modals */}
            <AssignApplicationsModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                selectedIds={selectedIds}
                selectedNames={students.filter((s: any) => selectedIds.includes(s.id)).map((s: any) => s.name)}
                onSuccess={() => {
                    setSelectedIds([]);
                    refetch();
                }}
                apiEndpoint="/api/students/bulk-assign"
                title="Students"
                moduleName="students"
            />

            <ConfirmDialog
                isOpen={showBulkDeleteConfirm}
                onClose={() => setShowBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Delete Students"
                description={`Are you sure you want to delete ${selectedIds.length} selected students? This action cannot be undone.`}
                confirmText={isBulkDeleting ? "Deleting..." : "Delete All"}
                variant="destructive"
            />

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Student"
                description="Are you sure you want to delete this student? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    );
}
