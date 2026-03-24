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
import { useStudents } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/use-debounce";
import { useRolePath } from "@/hooks/use-role-path";
import { useCountries, useCounselors } from "@/hooks/use-masters";

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

    const { data: countries } = useCountries();
    const { data: counselors } = useCounselors();

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

    if (isLoading) {
        return (
            <div className="p-10 text-center">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-200 rounded w-1/4 mx-auto"></div>
                    <div className="h-64 bg-gray-200 rounded max-w-5xl mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 p-3 sm:p-4">
            <Card className="border-0 rounded-3xl overflow-hidden bg-card">
                <CardContent className="p-4">
                    {/* Bulk Actions Toolbar */}
                    <div className="flex flex-wrap items-center justify-between mb-6 gap-4 bg-muted/30 dark:bg-slate-900/40 backdrop-blur-sm p-4 rounded-2xl border border-border/50 shadow-sm">
                        <div className="flex items-center gap-3">
                             <div className="h-11 w-11 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center shadow-inner">
                                <Users className="h-5 w-5 text-primary" />
                             </div>
                             <div>
                                <h2 className="text-lg font-bold text-foreground tracking-tight">Student Management</h2>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-70">Total {pagination.total} Students</p>
                             </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportExcel}
                                disabled={isExporting}
                                className="h-9 rounded-xl border-border bg-background/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 gap-2 text-[11px] font-black uppercase tracking-wider transition-all shadow-sm"
                            >
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                {isExporting ? "Exporting..." : "Excel"}
                            </Button>

                            <div className="h-6 w-px bg-border/60 mx-1 hidden sm:block" />

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAssignModal(true)}
                                disabled={selectedIds.length === 0}
                                className="h-9 rounded-xl border-border bg-background/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 gap-2 text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-30 shadow-sm"
                            >
                                <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                Assign
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowEmailModal(true)}
                                disabled={selectedIds.length === 0}
                                className="h-9 rounded-xl border-border bg-background/50 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 gap-2 text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-30 shadow-sm"
                            >
                                <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                Email
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowWhatsappModal(true)}
                                disabled={selectedIds.length === 0}
                                className="h-9 rounded-xl border-border bg-background/50 hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 gap-2 text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-30 shadow-sm"
                            >
                                <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                Whatsapp
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowBulkDeleteConfirm(true)}
                                disabled={selectedIds.length === 0}
                                className="h-9 rounded-xl border-border bg-background/50 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 gap-2 text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-30 shadow-sm hover:border-red-200 dark:hover:border-red-500/30"
                            >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                Delete
                            </Button>
                        </div>
                    </div>

                    {/* Integrated Search and Action Row */}
                    <div className="flex flex-row items-center justify-between mb-4 gap-4">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                            <Input
                                placeholder="Search students..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-[13px] placeholder:text-muted-foreground/40 font-sans w-full"
                            />
                        </div>
                        <Button
                            onClick={() => router.push(prefixPath("/addstudent"))}
                            className="bg-primary hover:bg-primary/90 text-white rounded-xl h-9 px-6 transition-colors shadow-sm font-medium"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Student
                        </Button>
                    </div>

                    {/* Advanced Filters */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <div className="w-full sm:w-[150px]">
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 border-0 focus:ring-0">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Status</SelectItem>
                                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                                    <SelectItem value="APPLICANT">Applicant</SelectItem>
                                    <SelectItem value="ENROLLED">Enrolled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full sm:w-[150px]">
                            <Select value={onboardedBy} onValueChange={setOnboardedBy}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 border-0 focus:ring-0">
                                    <SelectValue placeholder="Onboarded By" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Staff</SelectItem>
                                    {counselors?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full sm:w-[150px]">
                            <Select value={interestedCountry} onValueChange={setInterestedCountry}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 border-0 focus:ring-0">
                                    <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Countries</SelectItem>
                                    {countries?.countries?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full sm:w-[150px]">
                            <Select value={intake} onValueChange={setIntake}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 border-0 focus:ring-0">
                                    <SelectValue placeholder="Intake" />
                                </SelectTrigger>
                                <SelectContent>
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
                selectedStudents={students.filter((s: any) => selectedIds.includes(s.id)).map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    phone: s.phone,
                    leadId: s.leadId
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
