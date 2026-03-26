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
    Mail, 
    Trash2, 
    UserPlus, 
    MessageCircle, 
    FilterX,
    Users
} from "lucide-react";
import { toast } from "sonner";
import { StudentsTable } from "@/components/dashboard/StudentsTable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AssignApplicationsModal } from "@/components/applications/AssignApplicationsModal";
import { EmailComposeModal } from "@/components/applications/EmailComposeModal";
import { WhatsappMessageModal } from "@/components/applications/WhatsappMessageModal";
import { useStudents, useStudentStats } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/use-debounce";
import { useRolePath } from "@/hooks/use-role-path";
import { useCountries, useCounselors } from "@/hooks/use-masters";
import { Badge } from "@/components/ui/badge";
import { StatusTabs, StatusTab } from "@/components/dashboard/StatusTabs";
import Link from "next/link";

export default function StudentsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { prefixPath } = useRolePath();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [onboardedBy, setOnboardedBy] = useState("ALL");
    const [interestedCountry, setInterestedCountry] = useState("ALL");
    const [intake, setIntake] = useState("ALL");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showWhatsappModal, setShowWhatsappModal] = useState(false);
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
        onboardedBy === "ALL" ? "" : onboardedBy,
        interestedCountry === "ALL" ? "" : interestedCountry,
        intake === "ALL" ? "" : intake
    );

    const { data: stats } = useStudentStats();
    const { data: countries } = useCountries();
    const { data: counselors } = useCounselors();
    const counts = stats || { ALL: 0, NEW: 0, DOCUMENT_PENDING: 0, DOCUMENT_VERIFIED: 0, APPLICATION_SUBMITTED: 0 };

    const studentStatusTabs: StatusTab[] = [
        { 
            id: "ALL", 
            label: (
                <div className="flex items-center gap-2">
                    All
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-primary/10 text-primary border-none">
                        {counts.ALL}
                    </Badge>
                </div>
            ), 
            color: "text-primary", 
            bg: "bg-primary/10" 
        },
        { 
            id: "NEW", 
            label: (
                <div className="flex items-center gap-2">
                    New
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-blue-100 text-blue-700 border-none">
                        {counts.NEW}
                    </Badge>
                </div>
            ), 
            color: "text-blue-600", 
            bg: "bg-blue-600/10" 
        },
        { 
            id: "DOCUMENT_PENDING", 
            label: (
                <div className="flex items-center gap-2">
                    Doc Pending
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-amber-100 text-amber-700 border-none">
                        {counts.DOCUMENT_PENDING}
                    </Badge>
                </div>
            ), 
            color: "text-amber-600", 
            bg: "bg-amber-600/10" 
        },
        { 
            id: "DOCUMENT_VERIFIED", 
            label: (
                <div className="flex items-center gap-2">
                    Doc Verified
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 border-none">
                        {counts.DOCUMENT_VERIFIED}
                    </Badge>
                </div>
            ), 
            color: "text-emerald-600", 
            bg: "bg-emerald-600/10" 
        },
        { 
            id: "APPLICATION_SUBMITTED", 
            label: (
                <div className="flex items-center gap-2">
                    Applied
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-indigo-100 text-indigo-700 border-none">
                        {counts.APPLICATION_SUBMITTED}
                    </Badge>
                </div>
            ), 
            color: "text-indigo-600", 
            bg: "bg-indigo-600/10" 
        },
    ];

    // Reset page on search/filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status, onboardedBy, interestedCountry, intake]);

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
                        onClick={() => setShowEmailModal(true)}
                        disabled={selectedIds.length === 0}
                        className="h-9 rounded-xl border-slate-200 hover:bg-slate-50 gap-2 text-[12px] font-bold disabled:opacity-50"
                    >
                        <Mail className="h-4 w-4 text-amber-600" />
                        Email
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowWhatsappModal(true)}
                        disabled={selectedIds.length === 0}
                        className="h-9 rounded-xl border-slate-200 hover:bg-slate-50 gap-2 text-[12px] font-bold disabled:opacity-50"
                    >
                        <MessageCircle className="h-4 w-4 text-green-600" />
                        Whatsapp
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
                    {/* Integrated Search Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <Input
                                placeholder="Search students..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-[13px] placeholder:text-muted-foreground/40 font-sans w-full"
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

                    <StatusTabs 
                        tabs={studentStatusTabs} 
                        activeTab={status} 
                        onTabChange={setStatus} 
                    />

                    {/* Advanced Filters */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        {/* Status Select replaced by StatusTabs */}

                        <div className="w-full sm:w-[150px]">
                            <Select value={onboardedBy} onValueChange={setOnboardedBy}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 dark:bg-transparent border-0 dark:border dark:border-white/10 shadow-sm focus:ring-0">
                                    <SelectValue placeholder="Onboarded By" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border dark:bg-slate-900">
                                    <SelectItem value="ALL">All Staff</SelectItem>
                                    {counselors?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full sm:w-[150px]">
                            <Select value={interestedCountry} onValueChange={setInterestedCountry}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 dark:bg-transparent border-0 dark:border dark:border-white/10 shadow-sm focus:ring-0">
                                    <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border dark:bg-slate-900">
                                    <SelectItem value="ALL">All Countries</SelectItem>
                                    {countries?.countries?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full sm:w-[150px]">
                            <Select value={intake} onValueChange={setIntake}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 dark:bg-transparent border-0 dark:border dark:border-white/10 shadow-sm focus:ring-0">
                                    <SelectValue placeholder="Intake" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border dark:bg-slate-900">
                                    <SelectItem value="ALL">All Intakes</SelectItem>
                                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                                        <SelectItem key={m} value={m}>{m} 2024/25</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {(status !== "ALL" || onboardedBy !== "ALL" || interestedCountry !== "ALL" || intake !== "ALL") && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setStatus("ALL");
                                    setOnboardedBy("ALL");
                                    setInterestedCountry("ALL");
                                    setIntake("ALL");
                                }}
                                className="h-8 text-[11px] text-muted-foreground hover:text-destructive gap-1"
                            >
                                <FilterX className="h-3 w-3" /> Clear filters
                            </Button>
                        )}
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

            <EmailComposeModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                selectedEmails={students.filter((s: any) => selectedIds.includes(s.id)).map((s: any) => s.email).filter(Boolean)}
                apiEndpoint="/api/applications/email" 
            />

            <WhatsappMessageModal
                isOpen={showWhatsappModal}
                onClose={() => setShowWhatsappModal(false)}
                selectedLeads={students.filter((s: any) => selectedIds.includes(s.id)).map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    phone: s.phone || ""
                }))}
                apiEndpoint="/api/applications/whatsapp"
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
