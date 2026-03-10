"use client";

import {
    useReactTable,
    getCoreRowModel,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    UserPlus,
    ChevronLeft,
    ChevronRight,
    Zap,
    Phone
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AssignLeadSheet } from "./AssignLeadSheet";
import { useSession } from "next-auth/react";
import { useRolePath } from "@/hooks/use-role-path";
import { ConvertToStudentModal } from "./ConvertToStudentModal";
import { Checkbox } from "@/components/ui/checkbox";

import { toast } from "sonner";
import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LeadForm } from "./LeadForm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUpdateLead, useDeleteLead } from "@/hooks/use-leads";
import type { Lead as PrismaLead } from '@/lib/prisma';
import { cn } from "@/lib/utils";

// Extended Lead type to include assignments
interface Lead extends Omit<PrismaLead, "createdAt" | "updatedAt"> {
    createdAt: string | Date;
    updatedAt: string | Date;
    assignments?: {
        employee: {
            name: string;
            email: string;
        }
    }[];
}

const statusOptions = [
    "NEW",
    "UNDER_REVIEW",
    "CONTACTED",
    "COUNSELLING_SCHEDULED",
    "COUNSELLING_COMPLETED",
    "FOLLOWUP_REQUIRED",
    "INTERESTED",
    "NOT_INTERESTED",
    "ON_HOLD",
    "CLOSED",
    "CONVERTED"
];
const tempOptions = ["COLD", "WARM", "HOT"];

export function LeadsTable({
    data,
    onUpdate,
    pagination
}: {
    data: Lead[];
    onUpdate: () => void;
    pagination?: {
        page: number;
        totalPages: number;
        pageSize: number;
        onPageChange: (page: number) => void;
        onPageSizeChange: (pageSize: number) => void;
    }
}) {
    const { prefixPath } = useRolePath();
    const router = useRouter();
    const { data: session } = useSession() as any;
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<{ id: string; name: string } | null>(null);
    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
    const [convertModalOpen, setConvertModalOpen] = useState(false);
    const [convertingLead, setConvertingLead] = useState<any>(null);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelectAll = () => {
        if (selectedIds.size === data.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(data.map(l => l.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    // Mutations
    const updateLeadMutation = useUpdateLead();
    const deleteLeadMutation = useDeleteLead();

    // Call state
    const [isCalling, setIsCalling] = useState<string | null>(null);

    // Delete Dialog State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

    const handleCall = async (lead: Lead) => {
        setIsCalling(lead.id);
        try {
            const res = await axios.post('/api/exotel/call', {
                employeeId: session?.user?.id,
                targetType: 'lead',
                targetId: lead.id,
            });
            toast.success(`Call initiated! SID: ${res.data.callSid}`);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to initiate call');
        } finally {
            setIsCalling(null);
        }
    };

    const handleUpdate = async (id: string, field: string, value: string) => {
        try {
            await updateLeadMutation.mutateAsync({ id, data: { [field]: value } });
            toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated`);
            onUpdate();
        } catch (error) {
            toast.error("Failed to update lead");
        }
    };

    const handleDeleteClick = (id: string) => {
        setLeadToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!leadToDelete) return;

        try {
            await deleteLeadMutation.mutateAsync(leadToDelete);
            toast.success("Lead deleted successfully");
            onUpdate();
        } catch (error) {
            toast.error("Failed to delete lead");
        } finally {
            setDeleteDialogOpen(false);
            setLeadToDelete(null);
        }
    };

    const handleAssignClick = (lead: Lead) => {
        setSelectedLead({ id: lead.id, name: lead.name });
        setAssignDialogOpen(true);
    };

    const table = useReactTable({
        data,
        columns: [], // We are manualy rendering now
        getCoreRowModel: getCoreRowModel(),
    });

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            NEW: "text-blue-600 bg-blue-600",
            UNDER_REVIEW: "text-amber-600 bg-amber-600",
            CONTACTED: "text-purple-600 bg-purple-600",
            COUNSELLING_SCHEDULED: "text-cyan-600 bg-cyan-600",
            COUNSELLING_COMPLETED: "text-teal-600 bg-teal-600",
            FOLLOWUP_REQUIRED: "text-rose-600 bg-rose-600",
            INTERESTED: "text-emerald-600 bg-emerald-600",
            NOT_INTERESTED: "text-slate-500 bg-slate-500",
            ON_HOLD: "text-orange-500 bg-orange-500",
            CLOSED: "text-gray-900 bg-black",
            CONVERTED: "text-emerald-600 bg-emerald-600",
        };
        return colors[status] || "text-gray-600 bg-gray-400";
    };

    const getTempStyles = (temp: string) => {
        if (temp === "HOT") return "border-orange-200 text-orange-600 bg-orange-50";
        if (temp === "WARM") return "border-yellow-200 text-yellow-600 bg-yellow-50";
        return "border-blue-200 text-blue-600 bg-blue-50";
    };

    const getInterestStyles = (interest: string | null) => {
        if (!interest) return "hidden";
        const styles: Record<string, string> = {
            STUDY_ABROAD: "bg-blue-100 text-blue-700 border-blue-200",
            SKILL_DEVELOPMENT: "bg-purple-100 text-purple-700 border-purple-200",
            LOAN: "bg-orange-100 text-orange-700 border-orange-200",
            MBBS: "bg-green-100 text-green-700 border-green-200",
            OTHER: "bg-gray-100 text-gray-700 border-gray-200",
        };
        return styles[interest] || "bg-gray-100 text-gray-700 border-gray-200";
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} leads?`)) return;

        try {
            for (const id of Array.from(selectedIds)) {
                await deleteLeadMutation.mutateAsync(id);
            }
            toast.success("Leads deleted successfully");
            setSelectedIds(new Set());
            onUpdate();
        } catch (error) {
            toast.error("Failed to delete some leads");
        }
    };

    const handleBulkAssign = () => {
        if (selectedIds.size === 0) return;
        // For now, use the first selected lead's name for the sheet title or just "Multiple"
        setSelectedLead({ id: Array.from(selectedIds).join(','), name: `${selectedIds.size} Leads` });
        setAssignDialogOpen(true);
    };

    return (
        <div className="w-full flex flex-col h-full bg-background rounded-2xl border border-border/50 overflow-hidden shadow-sm relative">
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="absolute top-0 left-0 right-0 z-10 bg-primary h-14 flex items-center justify-between px-6 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-4 text-white">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedIds(new Set())}
                            className="text-white hover:bg-white/20 p-1 h-auto"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-bold text-sm tracking-tight">{selectedIds.size} Leads Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {(session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER") && (
                            <Button
                                onClick={handleBulkAssign}
                                variant="secondary"
                                size="sm"
                                className="h-9 px-4 rounded-xl font-bold flex items-center gap-2 border-0 shadow-sm"
                            >
                                <UserPlus className="h-4 w-4" /> Assign
                            </Button>
                        )}
                        <Button
                            onClick={handleBulkDelete}
                            variant="destructive"
                            size="sm"
                            className="h-9 px-4 rounded-xl font-bold flex items-center gap-2 border-0 shadow-sm bg-red-500 hover:bg-red-600"
                        >
                            <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                    </div>
                </div>
            )}
            {/* Header - Desktop Only */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/30 border-b border-border/50 items-center">
                <div className="col-span-5 flex items-center gap-4">
                    <Checkbox
                        checked={data.length > 0 && selectedIds.size === data.length}
                        onCheckedChange={toggleSelectAll}
                        className="rounded-md"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Lead Details</span>
                </div>
                <div className="col-span-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 text-center">Source</div>
                <div className="col-span-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 text-center">Counselor</div>
                <div className="col-span-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 text-center">Status</div>
                <div className="col-span-1 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 text-right">Actions</div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-border/40">
                {data.length > 0 ? (
                    data.map((lead) => (
                        <div
                            key={lead.id}
                            onClick={() => router.push(prefixPath(`/leads/${lead.id}`))}
                            className={cn(
                                "group grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center p-4 sm:p-5 hover:bg-muted/30 transition-all cursor-pointer relative",
                                selectedIds.has(lead.id) && "bg-primary/5 hover:bg-primary/10"
                            )}
                        >
                            {/* 1. Lead Name, Email, Phone + Avatar */}
                            <div className="col-span-1 md:col-span-5 flex items-start gap-4 min-w-0">
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedIds.has(lead.id)}
                                            onCheckedChange={() => toggleSelect(lead.id)}
                                            className="rounded-md"
                                        />
                                    </div>
                                    <div className="flex-shrink-0 mt-0.5">
                                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base sm:text-lg border border-primary/20 shadow-sm transition-transform group-hover:scale-105">
                                            {lead.name.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <div className="flex flex-row items-baseline gap-3">
                                        <h3 className="font-bold text-[16px] text-foreground tracking-tight group-hover:text-primary transition-colors whitespace-nowrap">
                                            {lead.name}
                                        </h3>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[13px] text-muted-foreground/70 font-medium truncate">
                                                {lead.email || "No Email"}
                                            </span>
                                            <p className="text-[12px] text-muted-foreground/60 font-medium leading-none mt-0.5">
                                                {lead.phone}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Source - Hidden on Mobile */}
                            <div className="hidden md:flex col-span-2 items-center justify-center">
                                <Badge variant="outline" className="text-[10px] sm:text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-lg border-muted-foreground/20 bg-muted/20 text-muted-foreground/80">
                                    {lead.source}
                                </Badge>
                            </div>

                            {/* 3. Counselor - Hidden on Mobile */}
                            <div className="hidden md:flex col-span-2 items-center justify-center">
                                <span className="text-[13px] font-semibold text-foreground/80">
                                    {lead.assignments && lead.assignments.length > 0
                                        ? lead.assignments[0].employee.name
                                        : <span className="text-muted-foreground/50 font-medium italic">Unassigned</span>
                                    }
                                </span>
                            </div>

                            {/* 4. Status & Temp */}
                            <div className="col-span-1 md:col-span-2 flex items-center justify-start md:justify-center gap-3">
                                {/* Status Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <div className={cn(
                                            "cursor-pointer hover:scale-105 transition-all inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border border-transparent shadow-sm",
                                            getStatusColor(lead.status).split(' ')[0],
                                            "bg-background border-border/40"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full ring-1 ring-offset-1 ring-transparent", getStatusColor(lead.status).split(' ')[1])} />
                                            {lead.status.replace(/_/g, ' ')}
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center" className="w-56">
                                        {statusOptions.map((opt) => (
                                            <DropdownMenuItem
                                                key={opt}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdate(lead.id, "status", opt);
                                                }}
                                                className={cn(
                                                    "text-xs font-semibold px-3 py-2 cursor-pointer",
                                                    opt === lead.status ? "bg-primary/10 text-primary" : ""
                                                )}
                                            >
                                                {opt.replace(/_/g, ' ')}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Temp Badge (Compact) */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <div className={cn(
                                            "cursor-pointer px-2 py-0.5 rounded-md text-[10px] font-black tracking-tighter border shadow-sm transition-transform hover:scale-110",
                                            getTempStyles(lead.temperature)
                                        )}>
                                            {lead.temperature.substring(0, 1)}
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {tempOptions.map((opt) => (
                                            <DropdownMenuItem
                                                key={opt}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdate(lead.id, "temperature", opt);
                                                }}
                                                className={cn(
                                                    "text-xs font-bold px-3 py-2 cursor-pointer",
                                                    opt === lead.temperature ? "bg-primary/10 text-primary" : ""
                                                )}
                                            >
                                                {opt}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {lead.interest && (
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[9px] font-bold uppercase px-1.5 py-0 rounded-md border text-center whitespace-nowrap",
                                            getInterestStyles(lead.interest)
                                        )}
                                    >
                                        {lead.interest.replace(/_/g, ' ')}
                                    </Badge>
                                )}
                            </div>

                            {/* 5. Actions */}
                            <div className="col-span-1 md:col-span-1 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                            <div className="hidden lg:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                e.stopPropagation();
                                handleCall(row.original);
                            }}
                            className={`h-8 w-8 p-0 ${isCalling === row.original.id ? 'text-orange-500' : 'text-primary hover:bg-primary/5'}`}
                            title="Call Lead"
                            disabled={!!isCalling}
                        >
                            <Phone className={`h-4 w-4 ${isCalling === row.original.id ? 'animate-pulse' : ''}`} />
                        </Button>
                        {(session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER" || session?.user?.role === "AGENT") && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAssignClick(lead);
                                    }}
                                                className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                                                title="Assign Lead"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                            </Button>
                                            {lead.status !== 'CONVERTED' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                            setConvertingLead(lead);
                                                        setConvertModalOpen(true);
                                                    }}
                                                    className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                    title="Convert to Student"
                                                >
                                                    <Zap className="h-4 w-4" />
                                                </Button>
                                            )}
                            </>
                        )}
                                </div>
                                            <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-muted font-bold">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 p-1.5">
                                        <DropdownMenuItem asChild>
                                            <Link href={prefixPath(`/leads/${lead.id}`)} className="flex items-center px-2 py-2 text-sm font-semibold cursor-pointer rounded-md">
                                                <Eye className="mr-3 h-4 w-4 text-blue-500" /> View Details
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setEditingLeadId(lead.id);
                                                setEditSheetOpen(true);
                                            }}
                                            className="flex items-center px-2 py-2 text-sm font-semibold cursor-pointer rounded-md"
                                        >
                                            <Pencil className="mr-3 h-4 w-4 text-amber-500" /> Edit Lead
                                        </DropdownMenuItem>

                                        {(session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER" || session?.user?.role === "AGENT") && (
                                            <>
                                                <div className="h-px bg-border/50 my-1" />
                                                <DropdownMenuItem
                                                    onClick={() => handleAssignClick(lead)}
                                                    className="flex items-center px-2 py-2 text-sm font-semibold cursor-pointer text-primary rounded-md"
                                                >
                                                    <UserPlus className="mr-3 h-4 w-4" /> Assign Counselor
                                                </DropdownMenuItem>
                                                {lead.status !== 'CONVERTED' && (
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setConvertingLead(lead);
                                                            setConvertModalOpen(true);
                                                        }}
                                                        className="flex items-center px-2 py-2 text-sm font-bold cursor-pointer text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 rounded-md"
                                                    >
                                                        <Zap className="mr-3 h-4 w-4" /> Convert to Student
                                                    </DropdownMenuItem>
                                                )}
                                                <div className="h-px bg-border/50 my-1" />
                                            </>
                                        )}

                                        <DropdownMenuItem
                                            className="flex items-center px-2 py-2 text-sm font-semibold text-red-600 cursor-pointer hover:bg-red-50 rounded-md"
                                            onClick={() => handleDeleteClick(lead.id)}
                                        >
                                            <Trash2 className="mr-3 h-4 w-4" /> Delete Lead
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                            <Eye className="h-6 w-6 opacity-20" />
                        </div>
                        <p className="font-medium text-sm">No leads found matching your filters</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {pagination && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/10">
                    <div className="flex items-center gap-3">
                        <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Show</span>
                        <select
                            value={pagination.pageSize}
                            onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                            className="h-8 w-16 rounded-lg border border-border/50 bg-background px-2 text-[12px] font-bold focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                        >
                            {[5, 10, 20, 50].map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                            <span className="text-foreground">{pagination.page}</span> / {pagination.totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                                disabled={pagination.page <= 1}
                                className="h-8 w-8 border-border/50 bg-background hover:bg-muted text-foreground transition-all rounded-lg shadow-sm"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="h-8 w-8 border-border/50 bg-background hover:bg-muted text-foreground transition-all rounded-lg shadow-sm"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <AssignLeadSheet
                isOpen={assignDialogOpen}
                onClose={() => setAssignDialogOpen(false)}
                leadId={selectedLead?.id || null}
                leadName={selectedLead?.name || null}
                onAssign={onUpdate}
            />

            <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
                <SheetContent className="overflow-y-auto w-full sm:max-w-sm">
                    <SheetHeader>
                        <SheetTitle>Edit Lead</SheetTitle>
                        <SheetDescription>
                            Update the lead details below.
                        </SheetDescription>
                    </SheetHeader>
                    {editingLeadId && (
                        <LeadForm
                            leadId={editingLeadId}
                            onSuccess={() => {
                                setEditSheetOpen(false);
                                onUpdate();
                            }}
                        />
                    )}
                </SheetContent>
            </Sheet>

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setLeadToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Lead"
                description="Are you sure you want to delete this lead? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />

            <ConvertToStudentModal
                isOpen={convertModalOpen}
                onClose={() => setConvertModalOpen(false)}
                lead={convertingLead}
                onSuccess={(studentId) => {
                    setConvertModalOpen(false);
                    onUpdate();
                    toast.success("Lead converted successfully");
                    router.push(prefixPath(`/students/${studentId}`));
                }}
            />
        </div>
    );
}
