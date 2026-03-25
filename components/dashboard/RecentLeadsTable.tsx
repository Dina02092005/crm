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
import { useRouter } from "next/navigation";
import {
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRolePath } from "@/hooks/use-role-path";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useBulkDeleteLeads } from "@/hooks/use-leads";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface RecentLead {
    id: string;
    name: string;
    email?: string | null;
    phone: string;
    status: string;
    interest?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    customer?: {
        name: string;
        email?: string;
        phone?: string;
    } | null;
}

export function RecentLeadsTable({ data, onUpdate }: { data: RecentLead[]; onUpdate: () => void }) {
    const { prefixPath } = useRolePath();
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

    const bulkDeleteLeads = useBulkDeleteLeads();

    const totalPages = Math.ceil(data.length / pageSize);
    const paginatedData = data.slice((page - 1) * pageSize, page * pageSize);

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(paginatedData.map((l) => l.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const handleBulkDelete = async () => {
        try {
            await bulkDeleteLeads.mutateAsync(Array.from(selectedIds));
            setSelectedIds(new Set());
            onUpdate();
        } catch (error) {
            // Error handled by mutation
        } finally {
            setBulkDeleteDialogOpen(false);
        }
    };

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

    return (
        <div className="w-full relative bg-card h-full flex flex-col rounded-md border shadow-sm overflow-hidden">
            {selectedIds.size > 0 && (
                <div className="absolute top-0 inset-x-0 h-12 bg-primary text-primary-foreground flex items-center justify-between px-6 z-20 animate-in slide-in-from-top-1">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">{selectedIds.size} leads selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs font-bold text-white hover:bg-white/10" 
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 px-4 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white border-0" 
                            onClick={() => setBulkDeleteDialogOpen(true)}
                        >
                            Delete Selected
                        </Button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto flex-1">
                <Table>
                    <TableHeader className="bg-muted theme-aware-header">
                        <TableRow className="border-b border-border/40">
                            <TableHead className="w-12 px-6 border-r border-border/40">
                                <Checkbox 
                                    checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                                    onCheckedChange={(v) => toggleSelectAll(!!v)}
                                />
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground py-3 px-4">Lead Details</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground py-3 px-4">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground py-3 px-4 text-right">Updated</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground py-3 px-6 text-right w-20">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.map((lead) => {
                            const isSelected = selectedIds.has(lead.id);
                            return (
                                <TableRow 
                                    key={lead.id} 
                                    className={cn(
                                        "group transition-all border-b border-border/40 last:border-0", 
                                        isSelected ? "bg-muted/50" : "hover:bg-muted/30"
                                    )}
                                >
                                    <TableCell className="px-6 border-r border-border/40">
                                        <Checkbox 
                                            checked={isSelected}
                                            onCheckedChange={() => toggleSelect(lead.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="py-4 px-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-bold text-foreground leading-none group-hover:text-primary transition-colors cursor-pointer" onClick={() => router.push(prefixPath(`/leads/${lead.id}`))}>
                                                {lead.name}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                                                {lead.phone}
                                                {lead.interest && (
                                                    <span className="opacity-40">• {lead.interest.replace(/_/g, ' ')}</span>
                                                )}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-4">
                                        <Badge 
                                            variant={getStatusVariant(lead.status)} 
                                            className="text-[9px] font-black uppercase px-2 py-0 h-4 rounded-sm border-0 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                                        >
                                            {lead.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4 px-4 text-right">
                                        <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
                                            {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-40 group-hover:opacity-100">
                                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-border/50">
                                                <DropdownMenuItem onClick={() => router.push(prefixPath(`/leads/${lead.id}`))}>
                                                    <Eye className="h-4 w-4 mr-2" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => router.push(prefixPath(`/leads/${lead.id}/edit`))}>
                                                    <Pencil className="h-4 w-4 mr-2" /> Edit Lead
                                                </DropdownMenuItem>
                                                <div className="h-px bg-muted my-1" />
                                                <DropdownMenuItem className="text-destructive font-medium">
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-sm font-bold">No recent activity</span>
                                        <span className="text-[10px] uppercase tracking-widest opacity-50 font-black">Waiting for new leads</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {data.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-card shrink-0">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                        Active Page {page} <span className="mx-2 opacity-50">/</span> {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl h-8 px-4 text-[10px] font-black uppercase tracking-tight border-border/40 hover:bg-muted transition-colors"
                            disabled={page <= 1}
                            onClick={() => setPage(Math.max(1, page - 1))}
                        >
                            <ChevronLeft className="h-3 w-3 mr-1" /> Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl h-8 px-4 text-[10px] font-black uppercase tracking-tight border-border/40 hover:bg-muted transition-colors"
                            disabled={page >= totalPages}
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                        >
                            Next <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={bulkDeleteDialogOpen}
                onClose={() => setBulkDeleteDialogOpen(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Erasure"
                description={`You are about to permanently remove ${selectedIds.size} lead records from the system. This action is irreversible.`}
                confirmText="Confirm Erasure"
                variant="destructive"
                isLoading={bulkDeleteLeads.isPending}
            />
        </div>
    );
}
