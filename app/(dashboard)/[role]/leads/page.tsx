"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
    Trash2, 
    UserPlus, 
    Plus,
    FileSpreadsheet,
    TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLeads, useLeadStats } from "@/hooks/use-leads";
import { useDebounce } from "@/hooks/use-debounce";
import { useRolePath } from "@/hooks/use-role-path";
import { useCountries, useCounselors } from "@/hooks/use-masters";
import { Badge } from "@/components/ui/badge";
import { BulkUploadLeadsButton } from "@/components/dashboard/BulkUploadLeadsButton";
import { StatusTabs, StatusTab } from "@/components/dashboard/StatusTabs";
import { AssignApplicationsModal } from "@/components/applications/AssignApplicationsModal";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/status-config";
import { LeadStatus, LeadTemperature } from "@/lib/enums";
import { DataTableFilters, FilterConfig } from "@/components/dashboard/DataTableFilters";

export default function LeadsPage() {
    const router = useRouter();
    const params = useParams();
    const role = (params?.role as string) || "COUNSELOR";
    const { data: session } = useSession();
    const { prefixPath } = useRolePath();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [onboardedBy, setOnboardedBy] = useState("ALL");
    const [interestedCountry, setInterestedCountry] = useState("ALL");
    const [intake, setIntake] = useState("ALL");
    const [source, setSource] = useState("ALL");
    const [temperature, setTemperature] = useState("ALL");
    const [applyLevel, setApplyLevel] = useState("ALL");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useLeads({
        page,
        limit,
        search: debouncedSearch,
        status: status === "ALL" ? "" : status,
        assignedTo: onboardedBy === "ALL" ? "" : onboardedBy,
        interestedCountry: interestedCountry === "ALL" ? "" : interestedCountry,
        intake: intake === "ALL" ? "" : intake,
        source: source === "ALL" ? "" : source,
        temperature: temperature === "ALL" ? "" : temperature,
        applyLevel: applyLevel === "ALL" ? "" : applyLevel
    });

    const { data: stats } = useLeadStats();
    const { data: countries } = useCountries();
    const { data: counselors } = useCounselors();
    const counts = stats || { 
        ALL: 0, 
        NEW: 0, 
        CONTACTED: 0, 
        INTERESTED: 0, 
        NOT_INTERESTED: 0,
        UNDER_REVIEW: 0,
        COUNSELLING_SCHEDULED: 0,
        COUNSELLING_COMPLETED: 0,
        FOLLOWUP_REQUIRED: 0,
        ON_HOLD: 0,
        CLOSED: 0,
        CONVERTED: 0
    };

    const leadStatusTabs: StatusTab[] = [
        "ALL",
        ...Object.values(LeadStatus)
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
    }, [debouncedSearch, status, onboardedBy, interestedCountry, intake, source, temperature, applyLevel]);

    const leads = data?.leads || [];
    const totalLeads = data?.pagination?.total || 0;
    const totalPages = data?.pagination?.totalPages || 1;

    const handleBulkDelete = async () => {
        try {
            setIsBulkDeleting(true);
            await axios.delete('/api/leads/bulk', { data: { ids: selectedIds } });
            toast.success(`${selectedIds.length} leads deleted`);
            setSelectedIds([]);
            refetch();
        } catch (error) {
            toast.error("Failed to delete leads");
        } finally {
            setIsBulkDeleting(false);
            setShowBulkDeleteConfirm(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`/api/leads/${deleteId}`);
            toast.success("Lead deleted successfully");
            refetch();
        } catch (error) {
            toast.error("Failed to delete lead");
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
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-foreground tracking-tight">Lead Management</h2>
                        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Total {totalLeads} Leads</p>
                     </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                            setOnboardedBy("ALL");
                            setInterestedCountry("ALL");
                            setIntake("ALL");
                            setSource("ALL");
                            setTemperature("ALL");
                            setApplyLevel("ALL");
                        }}
                        filters={[
                            {
                                key: "source",
                                label: "Source",
                                type: "select",
                                options: [
                                    { label: "Direct", value: "Direct" },
                                    { label: "Facebook", value: "Facebook" },
                                    { label: "Instagram", value: "Instagram" },
                                    { label: "Google", value: "Google" },
                                    { label: "Referral", value: "Referral" },
                                    { label: "Walk-in", value: "Walk-in" },
                                    { label: "Other", value: "Other" }
                                ]
                            },
                            {
                                key: "interestedCountry",
                                label: "Country",
                                type: "select",
                                options: countries?.countries?.map((c: any) => ({ label: c.name, value: c.name })) || []
                            },
                            {
                                key: "intake",
                                label: "Intake",
                                type: "select",
                                options: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => ({ label: `${m} 2024/25`, value: m }))
                            },
                            {
                                key: "applyLevel",
                                label: "Apply Level",
                                type: "select",
                                options: [
                                    { label: "UG", value: "UG" },
                                    { label: "PG", value: "PG" },
                                    { label: "Diploma", value: "Diploma" },
                                    { label: "PhD", value: "PhD" }
                                ]
                            },
                            {
                                key: "temperature",
                                label: "Temperature",
                                type: "select",
                                options: Object.values(LeadTemperature).map(t => ({ label: t, value: t }))
                            },
                            {
                                key: "onboardedBy",
                                label: "Assigned To",
                                type: "select",
                                options: counselors?.map((c: any) => ({ label: c.name, value: c.id })) || []
                            }
                        ]}
                        values={{
                            source,
                            interestedCountry,
                            intake,
                            applyLevel,
                            temperature,
                            onboardedBy
                        }}
                        onFilterChange={(key, value) => {
                            if (key === "source") setSource(value);
                            if (key === "interestedCountry") setInterestedCountry(value);
                            if (key === "intake") setIntake(value);
                            if (key === "applyLevel") setApplyLevel(value);
                            if (key === "temperature") setTemperature(value);
                            if (key === "onboardedBy") setOnboardedBy(value);
                        }}
                    />

                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <StatusTabs 
                                tabs={leadStatusTabs} 
                                activeTab={status} 
                                onTabChange={setStatus} 
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            {["ADMIN", "SUPER_ADMIN", "AGENT", "COUNSELOR"].includes(role) && <BulkUploadLeadsButton onSuccess={refetch} />}
                             <Link href={prefixPath("/leads/new")}>
                                <Button className="h-9 px-4 gap-2 font-bold text-[12px] rounded-xl shadow-md">
                                    <Plus className="h-4 w-4" /> Add Lead
                                </Button>
                            </Link>
                        </div>
                    </div>


                    {isLoading && page === 1 ? (
                        <div className="space-y-4 p-4">
                            <div className="h-10 bg-slate-50 dark:bg-white/5 animate-pulse rounded-xl w-full" />
                            <div className="h-64 bg-slate-50 dark:bg-white/5 animate-pulse rounded-xl w-full" />
                        </div>
                    ) : (
                        <LeadsTable
                            data={leads}
                            onUpdate={refetch}
                            selectedIds={selectedIds}
                            onSelectionChange={setSelectedIds}
                            pagination={{
                                page: page,
                                totalPages: totalPages,
                                pageSize: limit,
                                onPageChange: setPage,
                                onPageSizeChange: (v) => {
                                    setLimit(v);
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
                selectedNames={leads.filter((s: any) => selectedIds.includes(s.id)).map((s: any) => s.name)}
                onSuccess={() => {
                    setSelectedIds([]);
                    refetch();
                }}
                apiEndpoint="/api/leads/bulk-assign"
                title="Leads"
                moduleName="leads"
            />

            <ConfirmDialog
                isOpen={showBulkDeleteConfirm}
                onClose={() => setShowBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Delete Leads"
                description={`Are you sure you want to delete ${selectedIds.length} selected leads? This action cannot be undone.`}
                confirmText={isBulkDeleting ? "Deleting..." : "Delete All"}
                variant="destructive"
            />

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Lead"
                description="Are you sure you want to delete this lead? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    );
}
