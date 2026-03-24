"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { 
    Search, 
    Plus, 
    FileSpreadsheet, 
    Mail, 
    Trash2, 
    UserPlus, 
    MessageCircle, 
    FilterX,
    TrendingUp
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useLeads, useLeadStats } from "@/hooks/use-leads";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRolePath } from "@/hooks/use-role-path";
import { useSession } from "next-auth/react";
import { BulkUploadLeadsButton } from "@/components/dashboard/BulkUploadLeadsButton";
import { useCountries, useCounselors } from "@/hooks/use-masters";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import { AssignApplicationsModal } from "@/components/applications/AssignApplicationsModal";
import { EmailComposeModal } from "@/components/applications/EmailComposeModal";
import { WhatsappMessageModal } from "@/components/applications/WhatsappMessageModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function LeadsPage() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [assignedTo, setAssignedTo] = useState("ALL");
    const [interestedCountry, setInterestedCountry] = useState("ALL");
    const [highestQualification, setHighestQualification] = useState("ALL");
    const [interest, setInterest] = useState("ALL");
    const [source, setSource] = useState("ALL");
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const { data: session } = useSession() as any;
    const role = session?.user?.role;
    const { prefixPath } = useRolePath();

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showWhatsappModal, setShowWhatsappModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useLeads({
        page,
        limit,
        search: debouncedSearch,
        status,
        assignedTo: assignedTo === "ALL" ? "" : assignedTo,
        interestedCountry: interestedCountry === "ALL" ? "" : interestedCountry,
        highestQualification: highestQualification === "ALL" ? "" : highestQualification,
        interest: interest === "ALL" ? "" : interest,
        source: source === "ALL" ? "" : source,
        from: fromDate,
        to: toDate,
    });

    const { data: countries } = useCountries();
    const { data: counselors } = useCounselors();

    const leads = data?.leads || [];
    const totalPages = data?.pagination.totalPages || 0;
    const totalLeads = data?.pagination.total || 0;

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status, assignedTo, interestedCountry, highestQualification, interest, source, fromDate, toDate]);

    const { data: leadStats } = useLeadStats();

    const getCount = (id: string) => {
        if (!leadStats) return 0;
        return leadStats[id as keyof typeof leadStats] || 0;
    };

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

    const hasFilters = assignedTo !== "ALL" || interestedCountry !== "ALL" || highestQualification !== "ALL" || interest !== "ALL" || source !== "ALL" || fromDate || toDate;

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage and track your potential students and inquiries.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {role === "ADMIN" && <BulkUploadLeadsButton onSuccess={refetch} />}
                    <Link href={prefixPath("/leads/new")}>
                        <Button className="h-10 px-4 gap-2 font-medium">
                            <Plus className="h-4 w-4" /> Add Lead
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Bulk Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                <div className="flex items-center gap-2">
                     <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-primary" />
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Lead Management</h2>
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Total {totalLeads} Leads</p>
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

            {/* Filter & Actions Bar */}
            <div className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between border-b pb-4">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search leads..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-10 w-full bg-background"
                            />
                        </div>

                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="h-10 w-[140px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="NEW">New</SelectItem>
                                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                <SelectItem value="CONTACTED">Contacted</SelectItem>
                                <SelectItem value="CONVERTED">Converted</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={assignedTo} onValueChange={setAssignedTo}>
                            <SelectTrigger className="h-10 w-[180px]">
                                <SelectValue placeholder="Assigned To" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Counselors</SelectItem>
                                {counselors?.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={interest} onValueChange={setInterest}>
                            <SelectTrigger className="h-10 w-[160px]">
                                <SelectValue placeholder="Interest" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Interests</SelectItem>
                                <SelectItem value="STUDY_ABROAD">Study Abroad</SelectItem>
                                <SelectItem value="SKILL_DEVELOPMENT">Skill Development</SelectItem>
                                <SelectItem value="LOAN">Loan</SelectItem>
                                <SelectItem value="MBBS">MBBS</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>

                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setAssignedTo("ALL");
                                    setInterestedCountry("ALL");
                                    setHighestQualification("ALL");
                                    setInterest("ALL");
                                    setSource("ALL");
                                    setFromDate("");
                                    setToDate("");
                                }}
                                className="h-10 px-3 text-muted-foreground hover:text-foreground"
                            >
                                <FilterX className="h-4 w-4 mr-2" /> Reset
                            </Button>
                        )}
                    </div>
                </div>

                {/* Status Pills */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: "ALL", label: "All" },
                        { id: "NEW", label: "New" },
                        { id: "ASSIGNED", label: "Assigned" },
                        { id: "IN_PROGRESS", label: "In Progress" },
                        { id: "FOLLOW_UP", label: "Follow Up" },
                        { id: "CONVERTED", label: "Converted" },
                        { id: "LOST", label: "Lost" },
                    ].map((f) => {
                        const active = status === f.id;
                        return (
                            <button
                                key={f.id}
                                onClick={() => setStatus(f.id)}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-medium rounded-full border transition-colors",
                                    active 
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-muted-foreground border-input hover:bg-muted"
                                )}
                            >
                                {f.label}
                                <span className={cn(
                                    "ml-2 text-xs opacity-70",
                                    active ? "text-primary-foreground" : "text-muted-foreground"
                                )}>
                                    {getCount(f.id)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-background rounded-lg border shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                    <LeadsTable
                        data={leads}
                        onUpdate={refetch}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        pagination={{
                            page,
                            totalPages,
                            pageSize: limit,
                            onPageChange: setPage,
                            onPageSizeChange: (newLimit) => {
                                setLimit(newLimit);
                                setPage(1);
                            }
                        }}
                    />
                )}
            </div>

            {/* Modals */}
            <AssignApplicationsModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                selectedIds={selectedIds}
                selectedNames={leads.filter(l => selectedIds.includes(l.id)).map(l => l.name)}
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
                selectedEmails={leads.filter(l => selectedIds.includes(l.id)).map(l => l.email).filter(Boolean)}
                apiEndpoint="/api/applications/email"
            />

            <WhatsappMessageModal
                isOpen={showWhatsappModal}
                onClose={() => setShowWhatsappModal(false)}
                selectedLeads={leads.filter(l => selectedIds.includes(l.id)).map(l => ({
                    id: l.id,
                    name: l.name,
                    phone: l.phone
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
        </div>
    );
}
