"use client";

import { useState, useEffect, use, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
    Search, 
    Plane, 
    Filter, 
    SlidersHorizontal, 
    FileSpreadsheet, 
    Trash2, 
    UserPlus, 
    Mail, 
    MessageCircle,
    Globe
} from "lucide-react";
import { toast } from "sonner";
import { VisaApplicationsTable } from "@/components/dashboard/VisaApplicationsTable";
import { useVisaApplications, useVisaStats, useDeleteVisaApplication } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationHistoryModal } from "@/components/applications/ApplicationHistoryModal";
import { ApplicationNotesModal } from "@/components/applications/ApplicationNotesModal";
import { OfferLetterModal } from "@/components/applications/OfferLetterModal";
import { ApplicationCommentsModal } from "@/components/applications/ApplicationCommentsModal";
import { StudentVisaView } from "@/components/visa/StudentVisaView";
import { EditVisaCaseModal } from "@/components/visa/EditVisaCaseModal";
import axios from "axios";
import { AssignApplicationsModal } from "@/components/applications/AssignApplicationsModal";
import { EmailComposeModal } from "@/components/applications/EmailComposeModal";
import { WhatsappMessageModal } from "@/components/applications/WhatsappMessageModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusTabs, StatusTab } from "@/components/dashboard/StatusTabs";

function VisaApplicationsPageContent({ role }: { role: string }) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const debouncedSearch = useDebounce(search, 500);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    // Bulk action states
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showWhatsappModal, setShowWhatsappModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    // Modal states
    const [historyApp, setHistoryApp] = useState<any>(null);
    const [notesApp, setNotesApp] = useState<any>(null);
    const [offerLetterApp, setOfferLetterApp] = useState<any>(null);
    const [commentsApp, setCommentsApp] = useState<any>(null);
    const [editVisaApp, setEditVisaApp] = useState<any>(null);

    const { data, isLoading, refetch } = useVisaApplications(role === "student" ? "STUDENT" : undefined, page, limit, debouncedSearch, status);
    const deleteMutation = useDeleteVisaApplication();

    const visaApplications = (data?.visaApplications || []) as any[];
    const pagination = data?.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 };

    const { data: stats } = useVisaStats();
    const counts = stats || { ALL: 0, PENDING: 0, VISA_APPLICATION_SUBMITTED: 0, VISA_APPLICATION_IN_PROGRESS: 0, VISA_APPROVED: 0, VISA_REJECTED: 0, VISA_REFUSED: 0, DEFERRED: 0, ENROLLED: 0 };

    const visaStatusTabs: StatusTab[] = [
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
            id: "PENDING", 
            label: (
                <div className="flex items-center gap-2">
                    Pending
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-amber-100 text-amber-700 border-none">
                        {counts.PENDING}
                    </Badge>
                </div>
            ), 
            color: "text-amber-600", 
            bg: "bg-amber-600/10" 
        },
        { 
            id: "VISA_APPLICATION_SUBMITTED", 
            label: (
                <div className="flex items-center gap-2">
                    Submitted
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-blue-100 text-blue-700 border-none">
                        {counts.VISA_APPLICATION_SUBMITTED}
                    </Badge>
                </div>
            ), 
            color: "text-blue-600", 
            bg: "bg-blue-600/10" 
        },
        { 
            id: "VISA_APPLICATION_IN_PROGRESS", 
            label: (
                <div className="flex items-center gap-2">
                    In Process
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-indigo-100 text-indigo-700 border-none">
                        {counts.VISA_APPLICATION_IN_PROGRESS}
                    </Badge>
                </div>
            ), 
            color: "text-indigo-600", 
            bg: "bg-indigo-600/10" 
        },
        { 
            id: "VISA_APPROVED", 
            label: (
                <div className="flex items-center gap-2">
                    Approved
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 border-none">
                        {counts.VISA_APPROVED}
                    </Badge>
                </div>
            ), 
            color: "text-emerald-600", 
            bg: "bg-emerald-600/10" 
        },
        { 
            id: "VISA_REJECTED", 
            label: (
                <div className="flex items-center gap-2">
                    Rejected
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-rose-100 text-rose-700 border-none">
                        {counts.VISA_REJECTED}
                    </Badge>
                </div>
            ), 
            color: "text-rose-600", 
            bg: "bg-rose-600/10" 
        },
        { 
            id: "VISA_REFUSED", 
            label: (
                <div className="flex items-center gap-2">
                    Refused
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-red-100 text-red-700 border-none">
                        {counts.VISA_REFUSED}
                    </Badge>
                </div>
            ), 
            color: "text-red-700", 
            bg: "bg-red-700/10" 
        },
        { 
            id: "DEFERRED", 
            label: (
                <div className="flex items-center gap-2">
                    Deferred
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-pink-100 text-pink-700 border-none">
                        {counts.DEFERRED}
                    </Badge>
                </div>
            ), 
            color: "text-pink-600", 
            bg: "bg-pink-600/10" 
        },
        { 
            id: "ENROLLED", 
            label: (
                <div className="flex items-center gap-2">
                    Enrolled
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-cyan-100 text-cyan-700 border-none">
                        {counts.ENROLLED}
                    </Badge>
                </div>
            ), 
            color: "text-cyan-600", 
            bg: "bg-cyan-600/10" 
        },
    ];

    // Reset page on search/filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status]);

    const handleDelete = async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id);
            refetch();
        } catch (error) {
            console.error(error);
        }
    };

    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            const response = await axios.get('/api/visa-applications/export', {
                params: { search: debouncedSearch, status: status === "ALL" ? "" : status },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `visa_applications_export_${new Date().toISOString()}.xlsx`);
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
            await axios.delete('/api/visa-applications/bulk', { data: { ids: selectedIds } });
            toast.success(`${selectedIds.length} applications deleted`);
            setSelectedIds([]);
            refetch();
        } catch (error) {
            toast.error("Failed to delete applications");
        } finally {
            setIsBulkDeleting(false);
            setShowBulkDeleteConfirm(false);
        }
    };

    if (role === "student") {
        return (
            <div className="p-3 sm:p-4 bg-slate-50/50 min-h-screen">
                <StudentVisaView />
            </div>
        );
    }

    if (isLoading && page === 1) {
        return <div className="p-10 animate-pulse bg-muted/20 h-screen rounded-3xl" />;
    }

    return (
        <div className="flex flex-col gap-3 p-3 sm:p-4 bg-slate-50/50 dark:bg-transparent min-h-screen">
            {/* Bulk Actions Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 mb-0 bg-white dark:bg-transparent p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <div className="flex items-center gap-3">
                     <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <Plane className="h-5 w-5 text-indigo-600" />
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-foreground tracking-tight">Visa Applications</h2>
                        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Total {pagination.total} Records</p>
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
                    {/* Integrated Header Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <Input
                                placeholder="Search student or country..."
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
                        </div>
                    </div>

                    <StatusTabs 
                        tabs={visaStatusTabs} 
                        activeTab={status} 
                        onTabChange={setStatus} 
                    />

                    <VisaApplicationsTable
                        data={visaApplications}
                        onUpdate={refetch}
                        onDelete={handleDelete}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        onOpenHistory={(app) => setHistoryApp(app)}
                        onOpenComments={(app) => setCommentsApp(app)}
                        onOpenOfferLetters={(app) => setOfferLetterApp(app)}
                        onOpenNotes={(app) => setNotesApp(app)}
                        onOpenEdit={(app) => setEditVisaApp(app)}
                        pagination={{
                            page: pagination.page,
                            totalPages: pagination.totalPages,
                            pageSize: limit,
                            onPageChange: setPage,
                            onPageSizeChange: setLimit
                        }}
                    />
                </CardContent>
            </Card>

            {/* Modals */}
            <AssignApplicationsModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                selectedIds={selectedIds}
                selectedNames={visaApplications.filter(a => selectedIds.includes(a.id)).map(a => a.student?.name || "N/A")}
                onSuccess={() => {
                    setSelectedIds([]);
                    refetch();
                }}
                apiEndpoint="/api/visa-applications/bulk-assign"
                title="Visa Applications"
                moduleName="visa"
            />

            <EmailComposeModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                selectedEmails={visaApplications.filter(a => selectedIds.includes(a.id)).map(a => a.student?.email).filter(Boolean)}
                apiEndpoint="/api/applications/email"
            />

            <WhatsappMessageModal
                isOpen={showWhatsappModal}
                onClose={() => setShowWhatsappModal(false)}
                selectedLeads={visaApplications.filter(a => selectedIds.includes(a.id)).map(a => ({
                    id: a.id,
                    name: a.student?.name || "N/A",
                    phone: a.student?.phone || ""
                }))}
                apiEndpoint="/api/applications/whatsapp"
            />

            <ConfirmDialog
                isOpen={showBulkDeleteConfirm}
                onClose={() => setShowBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Delete Visa Applications"
                description={`Are you sure you want to delete ${selectedIds.length} selected visa applications? This action cannot be undone.`}
                confirmText={isBulkDeleting ? "Deleting..." : "Delete All"}
                variant="destructive"
            />

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
            
            <EditVisaCaseModal
                isOpen={!!editVisaApp}
                onClose={() => setEditVisaApp(null)}
                visaApplication={editVisaApp}
                onSuccess={refetch}
            />
        </div>
    );
}

export default function VisaApplicationsPage({ params }: { params: Promise<{ role: string }> }) {
    const { role } = use(params);
    return (
        <Suspense fallback={<div className="p-10 animate-pulse bg-muted/20 h-screen rounded-3xl" />}>
            <VisaApplicationsPageContent role={role} />
        </Suspense>
    );
}
