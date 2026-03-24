"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    MoreHorizontal,
    Eye,
    Trash2,
    Pencil,
    Calendar,
    Globe,
    Clock,
    ChevronLeft,
    ChevronRight,
    History,
    Plus,
    StickyNote,
    Phone,
    Mail,
    Undo2,
    Plane,
    CheckSquare,
    ArrowRightLeft,
    Users
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { VisaStatus } from "@/lib/enums";
import {
    useUpdateVisaApplication,
    useDeleteVisaApplication,
    useBulkDeleteVisaApplications
} from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useRolePath } from "@/hooks/use-role-path";
import { toast } from "sonner";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

import { AssignVisaApplicationSheet } from "./AssignVisaApplicationSheet";
import { useState } from "react";

interface VisaApplicationsTableProps {
    data: any[];
    onUpdate: () => void;
    onDelete: (id: string) => void;
    onOpenHistory?: (app: any) => void;
    onOpenComments?: (app: any) => void;
    onOpenOfferLetters?: (app: any) => void;
    onOpenNotes?: (app: any) => void;
    onOpenEdit?: (app: any) => void;
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
    pagination?: {
        page: number;
        totalPages: number;
        pageSize: number;
        onPageChange: (page: number) => void;
        onPageSizeChange: (pageSize: number) => void;
    }
}

export function VisaApplicationsTable({
    data,
    onUpdate,
    onDelete,
    onOpenHistory,
    onOpenComments,
    onOpenOfferLetters,
    onOpenNotes,
    onOpenEdit,
    selectedIds = [],
    onSelectionChange = () => { },
    pagination
}: VisaApplicationsTableProps) {
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const updateMutation = useUpdateVisaApplication();
    const [assignApp, setAssignApp] = useState<any>(null);

    const toggleSelectAll = () => {
        if (selectedIds.length === data.length) {
            onSelectionChange([]);
        } else {
            const allIds = data.map(s => s.id);
            onSelectionChange(allIds);
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = selectedIds.includes(id)
            ? selectedIds.filter(i => i !== id)
            : [...selectedIds, id];
        onSelectionChange(newSelected);
    };

    const getStatusVariant = (status: VisaStatus) => {
        const variants: Record<string, string> = {
            VISA_GRANTED: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
            VISA_APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
            VISA_REFUSED: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
            VISA_REJECTED: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
            VISA_APPLICATION_SUBMITTED: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
            UNDER_REVIEW: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
            DOCUMENTS_PENDING: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
        };
        return variants[status] || "bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    };

    const handleStatusChange = async (visaId: string, newStatus: string) => {
        try {
            await updateMutation.mutateAsync({
                id: visaId,
                data: { status: newStatus as VisaStatus }
            });
            toast.success("Status updated");
            onUpdate();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const bulkDeleteMutation = useBulkDeleteVisaApplications();

    const handleBulkDelete = async () => {
        try {
            await bulkDeleteMutation.mutateAsync(selectedIds);
            onSelectionChange([]);
            onUpdate();
        } catch (error) {
            // Error handled by mutation
        } finally {
            setBulkDeleteDialogOpen(false);
        }
    };

    return (
        <div className="relative border rounded-xl overflow-hidden bg-card shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="w-12 px-4 border-r dark:border-slate-800">
                            <Checkbox 
                                checked={data.length > 0 && selectedIds.length === data.length}
                                onCheckedChange={toggleSelectAll}
                            />
                        </TableHead>
                        <TableHead className="w-[300px] pl-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Student & Visa Type</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Destination</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Status</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Team / Flow</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Timeline</TableHead>
                        <TableHead className="text-right pr-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((app) => (
                        <TableRow 
                            key={app.id} 
                            className="group cursor-pointer hover:bg-muted/30 transition-colors border-b last:border-0"
                            onClick={(e) => {
                                const target = e.target as HTMLElement;
                                if (target.closest('button, [role="combobox"], [role="checkbox"], .select-trigger, [role="menuitem"]')) {
                                    return;
                                }
                                router.push(prefixPath(`/visa-applications/${app.id}`));
                            }}
                        >
                            <TableCell className="px-4 border-r dark:border-slate-800">
                                <Checkbox 
                                    checked={selectedIds.includes(app.id)}
                                    onCheckedChange={() => toggleSelect(app.id)}
                                />
                            </TableCell>
                            <TableCell className="pl-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm shrink-0">
                                        <AvatarFallback className="rounded-xl bg-indigo-50 text-indigo-600 text-xs font-black uppercase">
                                            {app.student?.name?.charAt(0) || "S"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm text-foreground truncate uppercase tracking-tight">{app.student?.name || "N/A"}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 tracking-widest">
                                                {app.visaType?.replace(/_/g, ' ') || "Standard"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/80">
                                        <Globe className="h-3 w-3 text-slate-400" />
                                        {app.university?.name || "Global University"}
                                    </div>
                                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        {app.country?.name || "N/A"}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <Select 
                                    value={app.status || "VISA_APPLICATION_IN_PROGRESS"} 
                                    onValueChange={(v) => handleStatusChange(app.id, v)}
                                >
                                    <SelectTrigger className={cn(
                                        "h-8 w-[180px] px-3 py-0 text-[10px] font-black uppercase border-0 shadow-none transition-all rounded-lg focus:ring-1 focus:ring-primary/20",
                                        getStatusVariant(app.status as VisaStatus)
                                    )}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border shadow-xl max-h-[300px]">
                                        {Object.values(VisaStatus).map(s => (
                                            <SelectItem key={s} value={s} className="text-[10px] font-black uppercase py-2">
                                                {s.replace(/_/g, ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col min-w-0 gap-1">
                                    <div className="text-[11px] font-bold text-foreground/70 truncate flex items-center gap-1.5">
                                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">Couns:</span>
                                        {app.counselor?.name || "Unassigned"}
                                    </div>
                                    <div className="text-[11px] font-medium text-muted-foreground/50 truncate flex items-center gap-1.5">
                                        <span className="text-[9px] text-muted-foreground/30 uppercase tracking-widest font-black">Agent:</span>
                                        {app.agent?.name || "Direct"}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/70 dark:text-slate-300">
                                        <Calendar className="h-3 w-3 text-slate-400" />
                                        Applied: {format(new Date(app.applicationDate), "dd MMM, yy")}
                                    </div>
                                    {app.appointmentDate && (
                                        <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase">
                                            <Clock className="h-3 w-3" />
                                            Appt: {format(new Date(app.appointmentDate), "dd MMM")}
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={async () => {
                                            try {
                                                await updateMutation.mutateAsync({ id: app.id, data: { status: "ENROLLED" as any } });
                                                toast.success("Enrolled successfully");
                                                onUpdate();
                                            } catch (e) { toast.error("Failed to enroll"); }
                                        }}
                                        className="h-8 px-3 text-[10px] font-black uppercase rounded-lg bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border border-cyan-100 transition-all"
                                    >
                                        <CheckSquare className="h-3.5 w-3.5 mr-1" />
                                        Enroll
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-lg">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-border shadow-xl p-1">
                                            <DropdownMenuItem onClick={() => router.push(prefixPath(`/visa-applications/${app.id}`))}>
                                                <Eye className="h-4 w-4 mr-2 text-slate-400" /> Detailed View
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setAssignApp(app)}>
                                                <Users className="h-4 w-4 mr-2 text-slate-400" /> Assign Team
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onOpenEdit?.(app)}>
                                                <Pencil className="h-4 w-4 mr-2 text-slate-400" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onOpenHistory?.(app)}>
                                                <History className="h-4 w-4 mr-2 text-slate-400" /> Visa History
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onOpenNotes?.(app)}>
                                                <StickyNote className="h-4 w-4 mr-2 text-slate-400" /> Case Notes
                                            </DropdownMenuItem>
                                            <div className="h-px bg-border my-1" />
                                            <DropdownMenuItem onClick={async () => {
                                                try {
                                                    await updateMutation.mutateAsync({ id: app.id, data: { status: "DEFERRED" as any } });
                                                    toast.success("Deferred successfully");
                                                    onUpdate();
                                                } catch (e) { toast.error("Failed to defer"); }
                                            }} className="text-pink-600">
                                                <ArrowRightLeft className="h-4 w-4 mr-2" /> Defer Case
                                            </DropdownMenuItem>
                                            <div className="h-px bg-border my-1" />
                                            <DropdownMenuItem 
                                                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                                onClick={() => onDelete(app.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Scrap Record
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {data.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center border border-border mb-2">
                                        <Plane className="h-6 w-6 text-muted-foreground/30" />
                                    </div>
                                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No visa applications</span>
                                    <span className="text-[10px] font-medium text-muted-foreground/50">Try adjusting your filters</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {pagination && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20 min-h-[64px]">
                    <div className="flex items-center gap-8">
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">
                            Page {pagination.page} <span className="text-muted-foreground/20 mx-2">/</span> {pagination.totalPages}
                        </div>
                        <div className="flex items-center gap-3 border-l pl-8 border-border">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display</span>
                            <Select
                                value={pagination.pageSize.toString()}
                                onValueChange={(v) => pagination.onPageSizeChange(Number(v))}
                            >
                                <SelectTrigger className="h-8 w-[72px] text-[10px] font-black border-border bg-background shadow-sm focus:ring-1 focus:ring-primary/20 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="min-w-[72px] rounded-xl shadow-2xl border-border">
                                    {[10, 20, 50, 100].map((size) => (
                                        <SelectItem key={size} value={size.toString()} className="text-[10px] font-black uppercase">
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-5 text-[10px] font-black uppercase tracking-widest border-border bg-background hover:bg-muted transition-all rounded-xl"
                            disabled={pagination.page <= 1}
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2 text-muted-foreground" /> Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-5 text-[10px] font-black uppercase tracking-widest border-border bg-background hover:bg-muted transition-all rounded-xl"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                        >
                            Next <ChevronRight className="h-4 w-4 ml-2 text-muted-foreground" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Modals */}
            <AssignVisaApplicationSheet
                isOpen={!!assignApp}
                onClose={() => setAssignApp(null)}
                visaId={assignApp?.id || null}
                studentName={assignApp?.student?.name || null}
                currentAgentId={assignApp?.agentId}
                currentCounselorId={assignApp?.counselorId}
                onAssign={() => {
                    onUpdate();
                    setAssignApp(null);
                }}
            />
            <ConfirmDialog
                isOpen={bulkDeleteDialogOpen}
                onClose={() => setBulkDeleteDialogOpen(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Delete Visa Applications"
                description={`Are you sure you want to delete ${selectedIds.length} selected visa applications? This action cannot be undone.`}
                confirmText="Delete All"
                variant="destructive"
            />
        </div>
    );
}
