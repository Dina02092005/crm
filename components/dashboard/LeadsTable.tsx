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
    Phone,
    GraduationCap,
    UserCheck,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { useUpdateLead, useDeleteLead, useBulkDeleteLeads } from "@/hooks/use-leads";
import type { Lead as PrismaLead } from '@/lib/prisma';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

export function LeadsTable({
    data,
    onUpdate,
    selectedIds: propsSelectedIds,
    onSelectionChange,
    pagination
}: {
    data: Lead[];
    onUpdate: () => void;
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
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

    const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);
    const activeSelectedIds = propsSelectedIds || localSelectedIds;
    const [isCalling, setIsCalling] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

    const updateLeadMutation = useUpdateLead();
    const deleteLeadMutation = useDeleteLead();
    const bulkDeleteLeadsMutation = useBulkDeleteLeads();

    const toggleSelectAll = () => {
        if (activeSelectedIds.length === data.length) {
            if (onSelectionChange) onSelectionChange([]);
            else setLocalSelectedIds([]);
        } else {
            const allIds = data.map(l => l.id);
            if (onSelectionChange) onSelectionChange(allIds);
            else setLocalSelectedIds(allIds);
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = activeSelectedIds.includes(id)
            ? activeSelectedIds.filter(i => i !== id)
            : [...activeSelectedIds, id];
        
        if (onSelectionChange) onSelectionChange(newSelected);
        else setLocalSelectedIds(newSelected);
    };

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

    const handleStatusChange = async (id: string, status: string) => {
        try {
            // @ts-ignore
            await updateLeadMutation.mutateAsync({ id, data: { status } });
            toast.success("Status updated");
            onUpdate();
        } catch (error) {
            toast.error("Failed to update status");
        }
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

    const handleOpenAssign = (lead: Lead) => {
        setSelectedLead({ id: lead.id, name: lead.name });
        setAssignDialogOpen(true);
    };

    const handleOpenConvert = (lead: Lead) => {
        setConvertingLead(lead);
        setConvertModalOpen(true);
    };

    const LEAD_STATUSES = [
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
        "CONVERTED",
    ];

    const getStatusVariant = (status: string): any => {
        const variants: Record<string, string> = {
            NEW: "outline",
            UNDER_REVIEW: "secondary",
            CONTACTED: "secondary",
            CONVERTED: "default",
            CLOSED: "destructive",
        };
        return variants[status] || "outline";
    };

    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

    const confirmBulkDelete = async () => {
        try {
            await bulkDeleteLeadsMutation.mutateAsync(activeSelectedIds);
            if (onSelectionChange) onSelectionChange([]);
            else setLocalSelectedIds([]);
            onUpdate();
        } catch (error) {
            // Error handled by mutation
        } finally {
            setBulkDeleteDialogOpen(false);
        }
    };

    return (
        <div className="relative border rounded-md overflow-hidden bg-card">

            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="w-12 px-4 border-r">
                            <Checkbox 
                                checked={data.length > 0 && activeSelectedIds.length === data.length}
                                onCheckedChange={toggleSelectAll}
                            />
                        </TableHead>
                        <TableHead className="min-w-[220px]">Lead Information</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Interest</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right px-4">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((lead) => (
                        <TableRow 
                            key={lead.id} 
                            className="group cursor-pointer hover:bg-muted/30 border-b last:border-0"
                            onClick={(e) => {
                                // If the click landed on an interactive element (button, checkbox, select), don't navigate
                                const target = e.target as HTMLElement;
                                if (target.closest('button, [role="combobox"], [role="checkbox"], .select-trigger, [role="menuitem"]')) {
                                    return;
                                }
                                router.push(prefixPath(`/leads/${lead.id}`));
                            }}
                        >
                            <TableCell className="px-4 border-r">
                                <Checkbox 
                                    checked={activeSelectedIds.includes(lead.id)}
                                    onCheckedChange={() => toggleSelect(lead.id)}
                                />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 rounded-md bg-muted border">
                                        <AvatarFallback className="rounded-md text-[10px] font-bold">
                                            {lead.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-semibold text-sm text-foreground truncate">{lead.name}</span>
                                        <span className="text-[11px] text-muted-foreground truncate">{lead.phone}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Select 
                                    value={lead.status} 
                                    onValueChange={(v) => handleStatusChange(lead.id, v)}
                                >
                                    <SelectTrigger className={cn(
                                        "h-7 w-[140px] px-2 py-0 text-[10px] font-bold uppercase border bg-background hover:bg-muted/50 transition-colors focus:ring-1 focus:ring-primary/20 select-trigger",
                                        getStatusVariant(lead.status) === "outline" && "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800",
                                        getStatusVariant(lead.status) === "secondary" && "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
                                        getStatusVariant(lead.status) === "default" && "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30",
                                        getStatusVariant(lead.status) === "destructive" && "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30"
                                    )}>
                                        <SelectValue>
                                            <Badge variant={getStatusVariant(lead.status)} className="capitalize px-2 py-0 text-[10px] font-bold border-0 bg-transparent shadow-none pointer-events-none">
                                                {lead.status.toLowerCase().replace(/_/g, ' ')}
                                            </Badge>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LEAD_STATUSES.map(s => (
                                            <SelectItem key={s} value={s} className="text-[10px] font-bold uppercase">
                                                {s.toLowerCase().replace(/_/g, ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <span className="text-xs font-medium text-foreground/80">
                                    {lead.assignments?.[0]?.employee.name || "—"}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className="text-xs text-muted-foreground">
                                    {lead.interest?.replace(/_/g, ' ') || "—"}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className="text-xs text-muted-foreground">{lead.source}</span>
                            </TableCell>
                            <TableCell className="text-right px-4">
                                <div className="flex items-center justify-end gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                        onClick={() => handleCall(lead)}
                                        disabled={!!isCalling}
                                        title="Call Lead"
                                    >
                                        <Phone className={cn("h-3.5 w-3.5", isCalling === lead.id && "animate-pulse")} />
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuItem onClick={() => router.push(prefixPath(`/leads/${lead.id}`))}>
                                                <Eye className="h-4 w-4 mr-2" /> View
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                setEditingLeadId(lead.id);
                                                setEditSheetOpen(true);
                                            }}>
                                                <Pencil className="h-4 w-4 mr-2" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenAssign(lead)}>
                                                <UserCheck className="h-4 w-4 mr-2" /> Assign
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenConvert(lead)}>
                                                <GraduationCap className="h-4 w-4 mr-2" /> Move to Student
                                            </DropdownMenuItem>
                                            <div className="h-px bg-muted my-1" />
                                            <DropdownMenuItem 
                                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                onClick={() => {
                                                    setLeadToDelete(lead.id);
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {data.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-sm font-medium">No leads found.</span>
                                    <span className="text-xs">Try adjusting your filters or search terms.</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {pagination && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 min-h-[56px]">
                    <div className="flex items-center gap-6">
                        <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                            Page {pagination.page} <span className="text-muted-foreground/20">/</span> {pagination.totalPages}
                        </div>
                        <div className="flex items-center gap-2 border-l pl-6 border-border">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Show</span>
                            <Select
                                value={pagination.pageSize.toString()}
                                onValueChange={(v) => pagination.onPageSizeChange(Number(v))}
                            >
                                <SelectTrigger className="h-7 w-[70px] text-[10px] font-bold border-muted/30 bg-background focus:ring-1 focus:ring-primary/20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="min-w-[70px]">
                                    {[10, 20, 50, 100].map((size) => (
                                        <SelectItem key={size} value={size.toString()} className="text-[10px] font-bold">
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
                            className="h-8 text-[10px] font-black uppercase px-4 border-muted/30 hover:bg-muted/50 transition-colors"
                            disabled={pagination.page <= 1}
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                        >
                            <ChevronLeft className="h-3.5 w-3.5 mr-1.5" /> Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px] font-black uppercase px-4 border-muted/30 hover:bg-muted/50 transition-colors"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                        >
                            Next <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
                        </Button>
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
                        <SheetDescription>Update the lead details below.</SheetDescription>
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
                onClose={() => setDeleteDialogOpen(false)}
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

            <ConfirmDialog
                isOpen={bulkDeleteDialogOpen}
                onClose={() => setBulkDeleteDialogOpen(false)}
                onConfirm={confirmBulkDelete}
                title="Bulk Delete Leads"
                description={`Are you sure you want to delete ${activeSelectedIds.length} selected leads? This action cannot be undone.`}
                confirmText="Delete All"
                variant="destructive"
            />
        </div>
    );
}
