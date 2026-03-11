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
    Mail, 
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
import { useRolePath } from "@/hooks/use-role-path";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Student } from "@/types/api";
import { useUpdateStudent } from "@/hooks/useApi";
import { AssignStudentSheet } from "./AssignStudentSheet";

interface StudentsTableProps {
    data: Student[];
    onUpdate: () => void;
    onDelete: (id: string) => void;
    pagination?: {
        page: number;
        totalPages: number;
        pageSize: number;
        onPageChange: (page: number) => void;
        onPageSizeChange: (pageSize: number) => void;
    }
}

export function StudentsTable({ data, onUpdate, onDelete, pagination }: StudentsTableProps) {
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const updateMutation = useUpdateStudent();
    const [assignSheetOpen, setAssignSheetOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<{ id: string, name: string, agentId?: string, counselorId?: string } | null>(null);

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
            NEW: "bg-blue-50 text-blue-600 border-blue-100",
            UNDER_REVIEW: "bg-amber-50 text-amber-600 border-amber-100",
            DOCUMENT_VERIFIED: "bg-emerald-50 text-emerald-600 border-emerald-100",
            INTERESTED: "bg-green-50 text-green-600 border-green-100",
            NOT_ELIGIBLE: "bg-rose-50 text-rose-600 border-rose-100",
            ON_HOLD: "bg-slate-50 text-slate-600 border-slate-100",
        };
        return variants[status] || "bg-slate-50 text-slate-500 border-slate-100";
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

    return (
        <div className="relative border rounded-xl overflow-hidden bg-background shadow-sm shadow-slate-200/50">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
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
                            className="group cursor-pointer hover:bg-muted/30 transition-colors border-b last:border-0"
                            onClick={(e) => {
                                const target = e.target as HTMLElement;
                                if (target.closest('button, [role="combobox"], [role="checkbox"], .select-trigger, [role="menuitem"]')) {
                                    return;
                                }
                                router.push(prefixPath(`/students/${student.id}`));
                            }}
                        >
                            <TableCell className="pl-6">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm shrink-0">
                                        <AvatarFallback className="rounded-xl bg-primary/5 text-primary text-xs font-black uppercase">
                                            {student.name?.charAt(0) || 'S'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm text-slate-900 truncate uppercase tracking-tight">{student.name || 'Unknown Student'}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-[9px] font-black uppercase py-0 px-1.5 border-slate-100 text-slate-400">
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
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                        <Phone className="h-3 w-3 text-slate-300" />
                                        {student.phone}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                                        <Mail className="h-3 w-3 text-slate-300" />
                                        {student.email || "No email"}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <Select 
                                    value={student.status || "NEW"} 
                                    onValueChange={(v) => handleStatusChange(student.id, v)}
                                >
                                    <SelectTrigger className={cn(
                                        "h-8 w-[160px] px-3 py-0 text-[10px] font-black uppercase border-0 shadow-none transition-all rounded-lg focus:ring-1 focus:ring-primary/20",
                                        getStatusVariant(student.status || "NEW")
                                    )}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
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
                                    <span className="text-xs font-bold text-slate-700 truncate">
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
                                    <Globe className="h-3.5 w-3.5 text-slate-300" />
                                    <span className="text-xs font-bold text-slate-600">
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
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 shadow-xl p-1">
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
                                            <div className="h-px bg-slate-100 my-1" />
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
                                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mb-2">
                                        <Users className="h-6 w-6 text-slate-200" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching students</span>
                                    <span className="text-[10px] font-medium text-slate-300">Try adjusting your filters</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {pagination && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/30 min-h-[64px]">
                    <div className="flex items-center gap-8">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
                            Page {pagination.page} <span className="text-slate-200 mx-2">/</span> {pagination.totalPages}
                        </div>
                        <div className="flex items-center gap-3 border-l pl-8 border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display</span>
                            <Select
                                value={pagination.pageSize.toString()}
                                onValueChange={(v) => pagination.onPageSizeChange(Number(v))}
                            >
                                <SelectTrigger className="h-8 w-[72px] text-[10px] font-black border-slate-200 bg-white shadow-sm focus:ring-1 focus:ring-primary/20 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="min-w-[72px] rounded-xl shadow-2xl border-slate-100">
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
                            className="h-9 px-5 text-[10px] font-black uppercase tracking-widest border-slate-200 bg-white hover:bg-slate-50 transition-all rounded-xl"
                            disabled={pagination.page <= 1}
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2 text-slate-400" /> Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-5 text-[10px] font-black uppercase tracking-widest border-slate-200 bg-white hover:bg-slate-50 transition-all rounded-xl"
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
        </div>
    );
}
