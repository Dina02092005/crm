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
    Globe,
    Plus
} from "lucide-react";
import { toast } from "sonner";
import { VisaApplicationsTable } from "@/components/dashboard/VisaApplicationsTable";
import { useVisaApplications, useVisaStats, useDeleteVisaApplication } from "@/hooks/useApi";
import { useCountries, useCounselors } from "@/hooks/use-masters";
import { DataTableFilters, FilterConfig } from "@/components/dashboard/DataTableFilters";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusTabs, StatusTab } from "@/components/dashboard/StatusTabs";
import { STATUS_CONFIG } from "@/lib/status-config";
import { VisaStatus } from "@/lib/enums";
import { cn } from "@/lib/utils";

function VisaApplicationsPageContent({ role }: { role: string }) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [countryId, setCountryId] = useState("ALL");
    const [visaType, setVisaType] = useState("ALL");
    const [intake, setIntake] = useState("ALL");
    const [agentId, setAgentId] = useState("ALL");
    const [counselorId, setCounselorId] = useState("ALL");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const debouncedSearch = useDebounce(search, 500);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    // Bulk action states
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    // Modal states
    const [historyApp, setHistoryApp] = useState<any>(null);
    const [notesApp, setNotesApp] = useState<any>(null);
    const [offerLetterApp, setOfferLetterApp] = useState<any>(null);
    const [commentsApp, setCommentsApp] = useState<any>(null);
    const [editVisaApp, setEditVisaApp] = useState<any>(null);

    const { data: countries } = useCountries();
    const { data: counselors } = useCounselors();

    const { data, isLoading, refetch } = useVisaApplications(
        role === "student" ? "STUDENT" : undefined,
        page,
        limit,
        debouncedSearch,
        status,
        countryId === "ALL" ? "" : countryId,
        visaType === "ALL" ? "" : visaType,
        intake === "ALL" ? "" : intake,
        agentId === "ALL" ? "" : agentId,
        counselorId === "ALL" ? "" : counselorId
    );
    const deleteMutation = useDeleteVisaApplication();

    const visaApplications = (data?.visaApplications || []) as any[];
    const pagination = data?.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 };

    const { data: stats } = useVisaStats();
    const counts = stats || { ALL: 0, PENDING: 0, VISA_APPLICATION_SUBMITTED: 0, VISA_APPLICATION_IN_PROGRESS: 0, VISA_APPROVED: 0, VISA_REJECTED: 0, VISA_REFUSED: 0, DEFERRED: 0, ENROLLED: 0 };

    const visaStatusTabs: StatusTab[] = [
        "ALL",
        ...Object.values(VisaStatus)
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
    }, [debouncedSearch, status, countryId, visaType, intake, agentId, counselorId]);

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
                            setCountryId("ALL");
                            setVisaType("ALL");
                            setIntake("ALL");
                            setAgentId("ALL");
                            setCounselorId("ALL");
                        }}
                        filters={[
                            {
                                key: "countryId",
                                label: "Country",
                                type: "select",
                                options: countries?.countries?.map((c: any) => ({ label: c.name, value: c.id })) || []
                            },
                            {
                                key: "visaType",
                                label: "Visa Type",
                                type: "select",
                                options: [
                                    { label: "Student Visa", value: "Student" },
                                    { label: "Visitor Visa", value: "Visitor" },
                                    { label: "Work Visa", value: "Work" }
                                ]
                            },
                            {
                                key: "intake",
                                label: "Intake",
                                type: "select",
                                options: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => ({ label: `${m} 2024/25`, value: m }))
                            },
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
                            }
                        ]}
                        values={{
                            countryId,
                            visaType,
                            intake,
                            agentId,
                            counselorId
                        }}
                        onFilterChange={(key, value) => {
                            if (key === "countryId") setCountryId(value);
                            if (key === "visaType") setVisaType(value);
                            if (key === "intake") setIntake(value);
                            if (key === "agentId") setAgentId(value);
                            if (key === "counselorId") setCounselorId(value);
                        }}
                    />

                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <StatusTabs 
                                tabs={visaStatusTabs} 
                                activeTab={status} 
                                onTabChange={setStatus} 
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="h-9 px-4 rounded-xl border-slate-200 dark:border-white/10 bg-white/50 dark:bg-transparent font-bold text-slate-600 dark:text-gray-300 gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                {pagination.total} Records
                            </Badge>
                        </div>
                    </div>

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
