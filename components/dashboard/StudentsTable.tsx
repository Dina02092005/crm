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
import { 
    MoreHorizontal, 
    Eye, 
    Pencil, 
    Trash2, 
    Phone, 
    Calendar, 
    ChevronLeft, 
    ChevronRight, 
    Plus, 
    UserCheck,
    Globe,
    Users
} from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useDeleteStudent, useBulkDeleteStudents, useUpdateStudent } from "@/hooks/useApi";
import { useRolePath } from "@/hooks/use-role-path";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Student } from "@/types/api";
import { AssignStudentSheet } from "./AssignStudentSheet";
import { Checkbox } from "@/components/ui/checkbox";

interface StudentsTableProps {
    data: Student[];
    onUpdate: () => void;
    onDelete: (id: string) => void;
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

export function StudentsTable({ 
    data, 
    onUpdate, 
    onDelete, 
    selectedIds = [], 
    onSelectionChange = () => { }, 
    pagination 
}: StudentsTableProps) {
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const updateMutation = useUpdateStudent();
    const [assignSheetOpen, setAssignSheetOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<{ id: string, name: string, agentId?: string, counselorId?: string } | null>(null);

    const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);
    const activeSelectedIds = (selectedIds && selectedIds.length > 0) ? selectedIds : localSelectedIds;

    const toggleSelectAll = () => {
        if (activeSelectedIds.length === data.length) {
            if (onSelectionChange) onSelectionChange([]);
            else setLocalSelectedIds([]);
        } else {
            const allIds = data.map(s => s.id);
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

    const STUDENT_STATUSES = [
        "NEW",
        "UNDER_REVIEW",
        "COUNSELLING_SCHEDULED",
        "COUNSELLING_COMPLETED",
        "DOCUMENT_PENDING",
        "DOCUMENT_VERIFIED",
        "INTERESTED",
        "NOT_INTERESTED",
        "NOT_ELIGIBLE",
        "ON_HOLD",
    ];

    const getStatusVariant = (status: string) => {
        const variants: Record<string, string> = {
            NEW: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
            UNDER_REVIEW: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
            COUNSELLING_SCHEDULED: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
            COUNSELLING_COMPLETED: "bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",
            DOCUMENT_PENDING: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
            DOCUMENT_VERIFIED: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
            INTERESTED: "bg-green-50 text-green-600 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
            NOT_INTERESTED: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-transparent dark:text-slate-400 dark:border-white/10",
            NOT_ELIGIBLE: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
            ON_HOLD: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-transparent dark:text-slate-300 dark:border-white/10",
        };
        return variants[status] || "bg-slate-100 text-slate-600 border-slate-200 dark:bg-transparent dark:text-slate-400 dark:border-white/10";
    };

    const handleStatusChange = async (studentId: string, newStatus: string) => {
        try {
            await updateMutation.mutateAsync({
                id: studentId,
                data: { status: newStatus }
            });
            toast.success("Status updated");
            onUpdate();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const bulkDeleteMutation = useBulkDeleteStudents();

    const handleBulkDelete = async () => {
        try {
            await bulkDeleteMutation.mutateAsync(activeSelectedIds);
            setLocalSelectedIds([]);
            onSelectionChange([]);
            onUpdate();
        } catch (error) {
            // Error handled by mutation
        } finally {
            setBulkDeleteDialogOpen(false);
        }
    };

    return (
        <div className="relative border dark:border-white/5 rounded-xl overflow-hidden bg-white dark:bg-transparent shadow-sm">
            {/* The overlay is now partially redundant if we have the top toolbar, but keeping it for now as a double-check */}
            {activeSelectedIds.length > 0 && (
                <div className="absolute top-0 inset-x-0 h-12 bg-primary text-primary-foreground flex items-center justify-between px-4 z-20">
                    <span className="text-[11px] font-bold uppercase tracking-wider">{activeSelectedIds.length} students selected</span>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => { setLocalSelectedIds([]); onSelectionChange([]); }} className="h-8 text-[10px] font-bold uppercase">Deselect All</Button>
                        <Button variant="destructive" size="sm" onClick={() => setBulkDeleteDialogOpen(true)} className="h-8 text-[10px] font-bold uppercase">Bulk Delete</Button>
                    </div>
                </div>
            )}
            <Table>
                <TableHeader className="bg-muted/30 dark:bg-white/5">
                    <TableRow>
                        <TableHead className="w-12 px-4 border-r dark:border-slate-800">
                            <Checkbox 
                                checked={data.length > 0 && activeSelectedIds.length === data.length}
                                onCheckedChange={toggleSelectAll}
                            />
                        </TableHead>
                        <TableHead className="w-[280px] pl-6">Student Information</TableHead>
                        <TableHead>Contact Detail</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned Team</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((student) => (
                        <TableRow 
                            key={student.id} 
                            className="group cursor-pointer hover:bg-muted/30 dark:hover:bg-white/5 transition-colors border-b last:border-0"
                            onClick={(e) => {
                                const target = e.target as HTMLElement;
                                if (target.closest('button, [role="combobox"], [role="checkbox"], .select-trigger, [role="menuitem"]')) {
                                    return;
                                }
                                router.push(prefixPath(`/students/${student.id}`));
                            }}
                        >
                            <TableCell className="px-4 border-r dark:border-slate-800">
                                <Checkbox 
                                    checked={activeSelectedIds.includes(student.id)}
                                    onCheckedChange={() => toggleSelect(student.id)}
                                />
                            </TableCell>
                            <TableCell className="pl-6">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm shrink-0">
                                        <AvatarFallback className="rounded-xl bg-primary/5 text-primary text-xs font-black uppercase">
                                            {student.name?.charAt(0) || 'S'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm text-foreground truncate uppercase tracking-tight">{student.name || 'Unknown Student'}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-[9px] font-black uppercase py-0 px-1.5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-500">
                                                ID: {student.id.slice(-6).toUpperCase()}
                                            </Badge>
                                            {student.lead?.source && (
                                                <span className="text-[10px] text-muted-foreground/60 font-medium">via {student.lead.source}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/70 dark:text-slate-300">
                                        <Phone className="h-3 w-3 text-slate-400" />
                                        {student.phone}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <Select 
                                    value={student.status || "NEW"} 
                                    onValueChange={(v) => handleStatusChange(student.id, v)}
                                >
                                    <SelectTrigger className={cn(
                                        "h-8 w-[160px] px-3 py-0 text-[10px] font-black uppercase border-0 dark:border dark:border-white/10 shadow-none transition-all rounded-lg focus:ring-1 focus:ring-primary/20",
                                        getStatusVariant(student.status || "NEW")
                                    )}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border shadow-xl">
                                        {STUDENT_STATUSES.map(s => (
                                            <SelectItem key={s} value={s} className="text-[10px] font-black uppercase py-2">
                                                {s.replace(/_/g, ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-foreground/80 truncate">
                                        {student.counselor?.name || student.agent?.name || "Unassigned"}
                                    </span>
                                    {student.counselor && student.agent && (
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                            Partner: {student.agent.name}
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-xs font-bold text-foreground/70">
                                        {student.lead?.interestedCountry || "N/A"}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                         onClick={() => router.push(prefixPath(`/students/${student.id}/applications/add`))}
                                        className="h-8 w-8 text-primary/60 hover:text-primary hover:bg-primary/5 rounded-lg"
                                        title="Move to Application"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-slate-50 rounded-lg">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl border-border shadow-xl p-1">
                                            <DropdownMenuItem onClick={() => router.push(prefixPath(`/students/${student.id}`))}>
                                                <Eye className="h-4 w-4 mr-2 text-slate-400" /> View Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push(prefixPath(`/students/${student.id}/edit`))}>
                                                <Pencil className="h-4 w-4 mr-2 text-slate-400" /> Edit Detail
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedStudent({
                                                        id: student.id,
                                                        name: student.name || 'Unknown Student',
                                                        agentId: student.agentId || undefined,
                                                        counselorId: student.counselorId || undefined
                                                    });
                                                    setAssignSheetOpen(true);
                                                }}>
                                                <UserCheck className="h-4 w-4 mr-2 text-slate-400" /> Assign Team
                                            </DropdownMenuItem>
                                            <div className="h-px bg-border my-1" />
                                            <DropdownMenuItem 
                                                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                                onClick={() => onDelete(student.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete Record
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {data.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center border border-border mb-2">
                                        <Users className="h-6 w-6 text-muted-foreground/30" />
                                    </div>
                                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No matching students</span>
                                    <span className="text-[10px] font-medium text-muted-foreground/50">Try adjusting your filters</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {pagination && (
                <div className="flex items-center justify-between px-6 py-4 border-t dark:border-white/5 bg-muted/20 dark:bg-white/5 min-h-[64px]">
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
                                <SelectTrigger className="h-8 w-[72px] text-[10px] font-black border-border dark:border-white/10 bg-white dark:bg-transparent shadow-sm focus:ring-1 focus:ring-primary/20 rounded-lg">
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
                            className="h-9 px-5 text-[10px] font-black uppercase tracking-widest border-border dark:border-white/10 bg-white dark:bg-transparent hover:bg-muted dark:hover:bg-white/5 transition-all rounded-xl"
                            disabled={pagination.page <= 1}
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2 text-muted-foreground" /> Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-5 text-[10px] font-black uppercase tracking-widest border-border dark:border-white/10 bg-white dark:bg-transparent hover:bg-muted dark:hover:bg-white/5 transition-all rounded-xl"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                        >
                            Next <ChevronRight className="h-4 w-4 ml-2 text-slate-400" />
                        </Button>
                    </div>
                </div>
            )}

            {selectedStudent && (
                <AssignStudentSheet
                    isOpen={assignSheetOpen}
                    onClose={() => {
                        setAssignSheetOpen(false);
                        setSelectedStudent(null);
                    }}
                    studentId={selectedStudent.id}
                    studentName={selectedStudent.name}
                    currentAgentId={selectedStudent.agentId}
                    currentCounselorId={selectedStudent.counselorId}
                    onUpdate={onUpdate}
                />
            )}
            <ConfirmDialog
                isOpen={bulkDeleteDialogOpen}
                onClose={() => setBulkDeleteDialogOpen(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Delete Students"
                description={`Are you sure you want to delete ${activeSelectedIds.length} selected students? This action cannot be undone.`}
                confirmText="Delete All"
                variant="destructive"
            />
        </div>
    );
}
