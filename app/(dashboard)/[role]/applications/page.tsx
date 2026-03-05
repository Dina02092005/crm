"use client";

import { useState, useEffect, Suspense, use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, FileSpreadsheet, Trash2, UserPlus, Mail, MessageSquare, Plus, FilterX } from "lucide-react";
import { toast } from "sonner";
import { ApplicationsTable } from "@/components/dashboard/ApplicationsTable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useApplications, useDeleteApplication, useBulkDeleteApplications } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useRolePath } from "@/hooks/use-role-path";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { Application } from "@/types/api";
import { useCountries, useCounselors, useUniversities } from "@/hooks/use-masters";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Modals
import { ApplicationHistoryModal } from "@/components/applications/ApplicationHistoryModal";
import { ApplicationNotesModal } from "@/components/applications/ApplicationNotesModal";
import { AssignApplicationsModal } from "@/components/applications/AssignApplicationsModal";
import { EmailComposeModal } from "@/components/applications/EmailComposeModal";
import { WhatsappMessageModal } from "@/components/applications/WhatsappMessageModal";
import { StudentApplicationsModal } from "@/components/applications/StudentApplicationsModal";
import { OfferLetterModal } from "@/components/applications/OfferLetterModal";
import { ApplicationCommentsModal } from "@/components/applications/ApplicationCommentsModal";
import { StudentApplicationsView } from "@/components/applications/StudentApplicationsView";

function ApplicationsPageContent({ role }: { role: string }) {
    const searchParams = useSearchParams();
    const urlStatus = searchParams.get("status");

    if (role === "student") {
        return (
            <div className="p-3 sm:p-4 bg-slate-50/50 min-h-screen">
                <StudentApplicationsView />
            </div>
        );
    }

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [status, setStatus] = useState<string | null>(urlStatus);
    const [countryId, setCountryId] = useState("ALL");
    const [universityId, setUniversityId] = useState("ALL");
    const [assignedToId, setAssignedToId] = useState("ALL");

    const router = useRouter();
    const { prefixPath } = useRolePath();

    // Sync status with URL params
    useEffect(() => {
        setStatus(urlStatus);
    }, [urlStatus]);

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useApplications(
        page,
        limit,
        debouncedSearch,
        status,
        undefined,
        universityId === "ALL" ? undefined : universityId,
        countryId === "ALL" ? undefined : countryId,
        assignedToId === "ALL" ? undefined : assignedToId
    );

    const { data: countries } = useCountries();
    const { data: universities } = useUniversities(countryId === "ALL" ? undefined : countryId);
    const { data: counselors } = useCounselors();

    const deleteMutation = useDeleteApplication();
    const bulkDeleteMutation = useBulkDeleteApplications();

    // Selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Modal states
    const [historyApp, setHistoryApp] = useState<any>(null);
    const [notesApp, setNotesApp] = useState<any>(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [studentAppsModal, setStudentAppsModal] = useState<any>(null);
    const [offerLetterApp, setOfferLetterApp] = useState<any>(null);
    const [commentsApp, setCommentsApp] = useState<any>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Reset page on search/filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status, countryId, universityId, assignedToId]);

    const applications = data?.applications || [];
    const pagination = data?.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        try {
            await bulkDeleteMutation.mutateAsync(selectedIds);
            toast.success("Applications deleted successfully");
            setSelectedIds([]);
            refetch();
        } catch (error) {
            toast.error("Failed to delete applications");
        } finally {
            setDeleteConfirmOpen(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await axios.get("/api/applications/export", {
                params: { search, status },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Applications_${new Date().toISOString()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Failed to export Excel");
        }
    };

    const handleAddAnother = (student: { id: string, name: string }) => {
        router.push(prefixPath(`/applications/new?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}`));
    };

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus === "ALL" ? null : newStatus);
    };

    return (
        <div className="flex flex-col gap-3 p-3 sm:p-4 bg-slate-50/50 min-h-screen">
            <Card className="border-0 rounded-3xl overflow-hidden bg-card">
                <CardContent className="p-4">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <Input
                                placeholder="Search applications..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-[13px] placeholder:text-muted-foreground/40 font-sans w-full"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-9 gap-2 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm">
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                <span className="hidden lg:inline">Excel</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteConfirmOpen(true)}
                                disabled={selectedIds.length === 0}
                                className="h-9 gap-2 border-slate-200 hover:bg-red-50 text-red-600 disabled:opacity-50 rounded-xl shadow-sm"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden lg:inline">Delete</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAssignModalOpen(true)}
                                disabled={selectedIds.length === 0}
                                className="h-9 gap-2 border-slate-200 hover:bg-blue-50 text-blue-600 disabled:opacity-50 rounded-xl shadow-sm"
                            >
                                <UserPlus className="h-4 w-4" />
                                <span className="hidden lg:inline">Assign</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEmailModalOpen(true)}
                                disabled={selectedIds.length === 0}
                                className="h-9 gap-2 border-slate-200 hover:bg-amber-50 text-amber-600 disabled:opacity-50 rounded-xl shadow-sm"
                            >
                                <Mail className="h-4 w-4" />
                                <span className="hidden lg:inline">Email</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setWhatsappModalOpen(true)}
                                disabled={selectedIds.length === 0}
                                className="h-9 gap-2 border-slate-200 hover:bg-green-50 text-green-600 disabled:opacity-50 rounded-xl shadow-sm"
                            >
                                <MessageSquare className="h-4 w-4" />
                                <span className="hidden lg:inline">Whatsapp</span>
                            </Button>

                            <Badge variant="outline" className="h-9 px-4 rounded-xl border-slate-200 bg-white/50 font-bold text-slate-600 gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                {pagination.total} Records
                            </Badge>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <div className="w-full sm:w-[180px]">
                            <Select value={countryId} onValueChange={(val) => { setCountryId(val); setUniversityId("ALL"); }}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 border-0 focus:ring-0">
                                    <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Countries</SelectItem>
                                    {countries?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full sm:w-[180px]">
                            <Select value={universityId} onValueChange={setUniversityId}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 border-0 focus:ring-0">
                                    <SelectValue placeholder="University" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Universities</SelectItem>
                                    {universities?.map((u: any) => (
                                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full sm:w-[180px]">
                            <Select value={assignedToId} onValueChange={setAssignedToId}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 border-0 focus:ring-0">
                                    <SelectValue placeholder="Assigned To" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Counselors</SelectItem>
                                    {counselors?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {(status || countryId !== "ALL" || universityId !== "ALL" || assignedToId !== "ALL") && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setStatus(null);
                                    setCountryId("ALL");
                                    setUniversityId("ALL");
                                    setAssignedToId("ALL");
                                }}
                                className="h-8 text-[11px] text-muted-foreground hover:text-destructive gap-1"
                            >
                                <FilterX className="h-3 w-3" /> Clear Filters
                            </Button>
                        )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {[
                            { id: "ALL", label: "All", color: "text-primary", bg: "bg-primary/10" },
                            { id: "PENDING", label: "Pending", color: "text-amber-600", bg: "bg-amber-600/10" },
                            { id: "APPROVED", label: "Approved", color: "text-emerald-600", bg: "bg-emerald-600/10" },
                            { id: "READY_FOR_VISA", label: "Ready for Visa", color: "text-orange-600", bg: "bg-orange-600/10" },
                            { id: "DEFERRED", label: "Deferred", color: "text-pink-600", bg: "bg-pink-600/10" },
                            { id: "ENROLLED", label: "Enrolled", color: "text-cyan-600", bg: "bg-cyan-600/10" },
                            { id: "REJECTED", label: "Rejected", color: "text-rose-600", bg: "bg-rose-600/10" },
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => handleStatusChange(f.id)}
                                className={`
                                    px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all border
                                    ${(status === f.id || (f.id === "ALL" && !status))
                                        ? `${f.bg} border-transparent shadow-sm ring-1 ring-inset ${f.color.replace('text-', 'ring-')}/30`
                                        : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200"
                                    }
                                `}
                            >
                                <span className={`text-[10px] font-extrabold uppercase tracking-widest ${(status === f.id || (f.id === "ALL" && !status)) ? f.color : ""}`}>
                                    {f.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {isLoading && page === 1 ? (
                        <div className="space-y-4 p-4">
                            <div className="h-10 bg-slate-50 animate-pulse rounded-xl w-full" />
                            <div className="h-40 bg-slate-50 animate-pulse rounded-xl w-full" />
                        </div>
                    ) : (
                        <ApplicationsTable
                            data={applications}
                            onUpdate={refetch}
                            onDelete={(id) => {
                                setSelectedIds([id]);
                                setDeleteConfirmOpen(true);
                            }}
                            onOpenHistory={(app) => setHistoryApp(app)}
                            onOpenComments={(app) => setCommentsApp(app)}
                            onOpenOfferLetters={(app) => setOfferLetterApp(app)}
                            onOpenNotes={(app) => setNotesApp(app)}
                            onOpenStudentApps={(student) => setStudentAppsModal(student)}
                            onAddAnother={handleAddAnother}
                            selectedIds={selectedIds}
                            onSelectionChange={setSelectedIds}
                            pagination={{
                                page,
                                totalPages: pagination.totalPages,
                                pageSize: limit,
                                onPageChange: setPage,
                                onPageSizeChange: setLimit
                            }}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            <ApplicationHistoryModal
                isOpen={!!historyApp}
                onClose={() => setHistoryApp(null)}
                application={historyApp}
            />

            <ApplicationNotesModal
                isOpen={!!notesApp}
                onClose={() => setNotesApp(null)}
                application={notesApp}
                onUpdate={refetch}
            />

            <AssignApplicationsModal
                isOpen={assignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                selectedIds={selectedIds}
                selectedNames={applications.filter((a: Application) => selectedIds.includes(a.id)).map((a: Application) => a.student?.name || "Unknown")}
                onSuccess={() => {
                    setSelectedIds([]);
                    refetch();
                }}
            />

            <EmailComposeModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                selectedEmails={applications.filter((a: Application) => selectedIds.includes(a.id)).map((a: Application) => a.student?.email).filter((email: any): email is string => !!email)}
            />

            <WhatsappMessageModal
                isOpen={whatsappModalOpen}
                onClose={() => setWhatsappModalOpen(false)}
                selectedStudents={applications.filter((a: Application) => selectedIds.includes(a.id)).map((a: Application) => ({
                    id: a.studentId,
                    name: a.student?.name || "Unknown",
                    phone: a.student?.phone || "No Phone",
                    leadId: a.student?.leadId
                }))}
            />

            <StudentApplicationsModal
                isOpen={!!studentAppsModal}
                onClose={() => setStudentAppsModal(null)}
                student={studentAppsModal}
                onUpdate={refetch}
            />

            <OfferLetterModal
                isOpen={!!offerLetterApp}
                onClose={() => setOfferLetterApp(null)}
                application={offerLetterApp}
                onUpdate={refetch}
            />

            <ApplicationCommentsModal
                isOpen={!!commentsApp}
                onClose={() => setCommentsApp(null)}
                application={commentsApp}
                onUpdate={refetch}
            />

            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleBulkDelete}
                title="Confirm Deletion"
                description={`Are you sure you want to delete ${selectedIds.length} application(s)? This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    );
}

export default function ApplicationsPage({ params }: { params: Promise<{ role: string }> }) {
    const { role } = use(params);
    return (
        <Suspense fallback={<div className="p-10 animate-pulse bg-muted/20 h-screen rounded-2xl" />}>
            <ApplicationsPageContent role={role} />
        </Suspense>
    );
}
