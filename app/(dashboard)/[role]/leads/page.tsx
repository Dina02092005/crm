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
    Plus, 
    FileSpreadsheet, 
    Mail, 
    Trash2, 
    UserPlus, 
    MessageCircle, 
    FilterX,
    TrendingUp,
    ChevronDown,
    MapPin,
    Calendar,
    Users
} from "lucide-react";
import { toast } from "sonner";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AssignApplicationsModal } from "@/components/applications/AssignApplicationsModal";
import { EmailComposeModal } from "@/components/applications/EmailComposeModal";
import { WhatsappMessageModal } from "@/components/applications/WhatsappMessageModal";
import { useLeads, useLeadStats } from "@/hooks/use-leads";
import { useDebounce } from "@/hooks/use-debounce";
import { useRolePath } from "@/hooks/use-role-path";
import { useCountries, useCounselors } from "@/hooks/use-masters";
import { Badge } from "@/components/ui/badge";
import { BulkUploadLeadsButton } from "@/components/dashboard/BulkUploadLeadsButton";
import { StatusTabs, StatusTab } from "@/components/dashboard/StatusTabs";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    const [showFilters, setShowFilters] = useState(false);

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useLeads({
        page,
        limit,
        search: debouncedSearch,
        status: status === "ALL" ? "" : status,
        assignedTo: onboardedBy === "ALL" ? "" : onboardedBy,
        interestedCountry: interestedCountry === "ALL" ? "" : interestedCountry,
        intake: intake === "ALL" ? "" : intake
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
            id: "CONTACTED", 
            label: (
                <div className="flex items-center gap-2">
                    Contacted
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-amber-100 text-amber-700 border-none">
                        {counts.CONTACTED}
                    </Badge>
                </div>
            ), 
            color: "text-amber-600", 
            bg: "bg-amber-600/10" 
        },
        { 
            id: "INTERESTED", 
            label: (
                <div className="flex items-center gap-2">
                    Qualified
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 border-none">
                        {counts.INTERESTED}
                    </Badge>
                </div>
            ), 
            color: "text-emerald-600", 
            bg: "bg-emerald-600/10" 
        },
        { 
            id: "NOT_INTERESTED", 
            label: (
                <div className="flex items-center gap-2">
                    Lost
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-rose-100 text-rose-700 border-none">
                        {counts.NOT_INTERESTED}
                    </Badge>
                </div>
            ), 
            color: "text-rose-600", 
            bg: "bg-rose-600/10" 
        },
    ];

    // Reset page on search/filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status, onboardedBy, interestedCountry, intake]);

    const leads = data?.leads || [];
    const totalLeads = data?.pagination?.total || 0;
    const totalPages = data?.pagination?.totalPages || 1;

    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            const response = await axios.get('/api/leads/export', {
                params: { search: debouncedSearch, status: status === "ALL" ? "" : status },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `leads_export_${new Date().toISOString()}.xlsx`);
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

    const handleDeleteLead = (id: string) => {
        setDeleteId(id);
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
                                placeholder="Search leads..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-[13px] placeholder:text-muted-foreground/40 font-sans w-full"
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

                    {/* Advanced Filters Toggle */}
                    <div className="mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="h-8 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground p-0 gap-2"
                        >
                            <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
                            {showFilters ? "Hide Advanced Filters" : "Show Advanced Filters"}
                        </Button>
                    </div>

                    <StatusTabs 
                        tabs={leadStatusTabs} 
                        activeTab={status} 
                        onTabChange={setStatus} 
                    />

                    {/* Advanced Filters Panel */}
                    <div className={cn(
                        "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6 transition-all duration-300",
                        showFilters ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0 overflow-hidden mb-0"
                    )}>
                        {/* Status label removed since we have tabs now, but if there are other status options it could stay as a label/spacer */}
                        
                        <div className="space-y-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Assigned To</label>
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

                        <div className="space-y-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Destination</label>
                            <Select value={interestedCountry} onValueChange={setInterestedCountry}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 dark:bg-transparent border-0 dark:border dark:border-white/10 shadow-sm focus:ring-0">
                                    <SelectValue placeholder="Lead Country" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border dark:bg-slate-900">
                                    <SelectItem value="ALL">All Countries</SelectItem>
                                    {countries?.countries?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Target Intake</label>
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
                            <div className="col-span-full pt-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setStatus("ALL");
                                        setOnboardedBy("ALL");
                                        setInterestedCountry("ALL");
                                        setIntake("ALL");
                                    }}
                                    className="h-8 text-[11px] text-muted-foreground hover:text-destructive gap-1 px-2"
                                >
                                    <FilterX className="h-3.5 w-3.5" /> Clear All Filters
                                </Button>
                            </div>
                        )}
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

            <EmailComposeModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                selectedEmails={leads.filter((s: any) => selectedIds.includes(s.id)).map((s: any) => s.email).filter(Boolean)}
                apiEndpoint="/api/applications/email" 
            />

            <WhatsappMessageModal
                isOpen={showWhatsappModal}
                onClose={() => setShowWhatsappModal(false)}
                selectedLeads={leads.filter((s: any) => selectedIds.includes(s.id)).map((s: any) => ({
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
