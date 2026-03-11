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
    Trash2,
    Plane,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    History,
    Plus,
    Clock,
    Mail,
    Phone,
    Globe,
    Eye,
    Undo2,
    Calendar,
    GraduationCap,
    Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRolePath } from "@/hooks/use-role-path";
import axios from "axios";
import { toast } from "sonner";
import { Application } from "@/types/api";
import { ApplicationStatus } from "@/lib/enums";
import { useUpdateApplication } from "@/hooks/useApi";
import { format } from "date-fns";
import { useState } from "react";
import { MoveToVisaModal } from "@/components/applications/MoveToVisaModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ApplicationsTableProps {
    data: Application[];
    onUpdate: () => void;
    onDelete: (id: string) => void;
    onAddAnother?: (student: { id: string, name: string }) => void;
    onConvertToVisa?: (application: Application) => void;
    onOpenHistory?: (application: Application) => void;
    onOpenComments?: (application: Application) => void;
    onOpenOfferLetters?: (application: Application) => void;
    onOpenNotes?: (application: Application) => void;
    onOpenStudentApps?: (student: any) => void;
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

export function ApplicationsTable({
    data,
    onUpdate,
    onDelete,
    onAddAnother,
    onConvertToVisa,
    onOpenHistory,
    onOpenComments,
    onOpenOfferLetters,
    onOpenNotes,
    onOpenStudentApps,
    selectedIds = [],
    onSelectionChange = () => { },
    pagination
}: ApplicationsTableProps) {
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const updateMutation = useUpdateApplication();
    const [promotingId, setPromotingId] = useState<string | null>(null);
    const [moveToVisaApp, setMoveToVisaApp] = useState<Application | null>(null);

    const handleRevert = async (appId: string) => {
        try {
            await axios.post(`/api/applications/${appId}/revert-from-visa`);
            toast.success("Application reverted to Visa stage");
            onUpdate?.();
        } catch (error: any) {
            console.error("Revert failed:", error);
            toast.error(error.response?.data?.error || "Failed to revert application");
        }
    };

    const getStatusVariant = (status: ApplicationStatus) => {
        const variants: Record<string, string> = {
            PENDING: "bg-blue-50 text-blue-600 border-blue-100",
            SUBMITTED: "bg-amber-50 text-amber-600 border-amber-100",
            FINALIZED: "bg-emerald-50 text-emerald-600 border-emerald-100",
            UNDER_REVIEW: "bg-purple-50 text-purple-600 border-purple-100",
            OFFER_RECEIVED: "bg-indigo-50 text-indigo-600 border-indigo-100",
            READY_FOR_VISA: "bg-orange-50 text-orange-600 border-orange-100",
            ENROLLED: "bg-cyan-50 text-cyan-600 border-cyan-100",
            REJECTED: "bg-rose-50 text-rose-600 border-rose-100",
        };
        return variants[status] || "bg-slate-50 text-slate-500 border-slate-100";
    };

    const handleStatusChange = async (appId: string, newStatus: string) => {
        try {
            await updateMutation.mutateAsync({
                id: appId,
                data: { status: newStatus as ApplicationStatus }
            });
            onUpdate?.();
            toast.success("Status updated successfully");
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="relative border rounded-xl overflow-hidden bg-background shadow-sm shadow-slate-200/50">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="w-[300px] pl-6 font-bold uppercase text-[10px] tracking-widest text-slate-400">Student & Course</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Country & Intake</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Status</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Team / Flow</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Timeline</TableHead>
                        <TableHead className="text-right pr-6 font-bold uppercase text-[10px] tracking-widest text-slate-400">Actions</TableHead>
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
                                router.push(prefixPath(`/applications/${app.id}`));
                            }}
                        >
                            <TableCell className="pl-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm shrink-0">
                                        <AvatarFallback className="rounded-xl bg-primary/5 text-primary text-xs font-black uppercase">
                                            {app.student?.name?.charAt(0) || "S"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm text-slate-900 truncate uppercase tracking-tight">{app.student?.name || "N/A"}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase truncate">
                                                <GraduationCap className="h-3 w-3" />
                                                {app.course?.name || app.intendedCourse || "General Course"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                        <Globe className="h-3 w-3 text-slate-300" />
                                        {app.country?.name || "Global"}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                        <Calendar className="h-3 w-3 text-slate-300" />
                                        {app.intake || "N/A Intake"}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <Select 
                                    value={app.status || "PENDING"} 
                                    onValueChange={(v) => handleStatusChange(app.id, v)}
                                >
                                    <SelectTrigger className={cn(
                                        "h-8 w-[160px] px-3 py-0 text-[10px] font-black uppercase border-0 shadow-none transition-all rounded-lg focus:ring-1 focus:ring-primary/20",
                                        getStatusVariant(app.status as ApplicationStatus)
                                    )}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                        {["PENDING", "SUBMITTED", "FINALIZED", "UNDER_REVIEW", "OFFER_RECEIVED", "READY_FOR_VISA", "ENROLLED", "DEFERRED", "REJECTED", "WITHDRAWN"].map(s => (
                                            <SelectItem key={s} value={s} className="text-[10px] font-black uppercase py-2">
                                                {s.replace(/_/g, ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col min-w-0 gap-1">
                                    <div className="text-[11px] font-bold text-slate-700 truncate flex items-center gap-1.5">
                                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">To:</span>
                                        {app.assignedTo?.name || "Unassigned"}
                                    </div>
                                    <div className="text-[11px] font-medium text-slate-400 truncate flex items-center gap-1.5">
                                        <span className="text-[9px] text-slate-300 uppercase tracking-widest font-black">By:</span>
                                        {app.assignedBy?.name || "System"}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                        <Calendar className="h-3 w-3 text-slate-300" />
                                        {format(new Date(app.createdAt), "dd MMM, yy")}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                                        <Clock className="h-3 w-3 text-slate-300" />
                                        {format(new Date(app.updatedAt), "hh:mm a")}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (app.status === "FINALIZED") setMoveToVisaApp(app);
                                            else if (app.status === "READY_FOR_VISA") toast.info("Already in Visa stage");
                                            else toast.error("Must be FINALIZED first");
                                        }}
                                        className={cn(
                                            "h-8 px-3 text-[10px] font-black uppercase rounded-lg transition-all border",
                                            app.status === "FINALIZED" ? "bg-amber-500 text-white border-transparent hover:bg-amber-600 shadow-sm" :
                                            app.status === "READY_FOR_VISA" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                                        )}
                                    >
                                        <Plane className="h-3.5 w-3.5 mr-1" />
                                        {app.status === "READY_FOR_VISA" ? "Visa Out" : "Visa"}
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-slate-50 rounded-lg">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-100 shadow-xl p-1">
                                            <DropdownMenuItem onClick={() => onOpenComments?.(app)}>
                                                <Eye className="h-4 w-4 mr-2 text-slate-400" /> View History
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onOpenNotes?.(app)}>
                                                <Plus className="h-4 w-4 mr-2 text-slate-400" /> Add Notes ({app._count?.notes || 0})
                                            </DropdownMenuItem>
                                            <div className="h-px bg-slate-100 my-1" />
                                            {["DEFERRED", "ENROLLED"].includes(app.status) && (
                                                <DropdownMenuItem onClick={() => handleRevert(app.id)}>
                                                    <Undo2 className="h-4 w-4 mr-2 text-slate-400" /> Revert State
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => onAddAnother?.({ id: app.studentId, name: app.student?.name || "Student" })}>
                                                <Plus className="h-4 w-4 mr-2 text-primary" /> Duplicate Move
                                            </DropdownMenuItem>
                                            <div className="h-px bg-slate-100 my-1" />
                                            <DropdownMenuItem 
                                                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                                onClick={() => onDelete(app.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete Entry
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
                                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mb-2">
                                        <Users className="h-6 w-6 text-slate-200" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching applications</span>
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
                            Page {pagination.page} / {pagination.totalPages}
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

            <MoveToVisaModal
                isOpen={!!moveToVisaApp}
                onClose={() => setMoveToVisaApp(null)}
                application={moveToVisaApp}
                onSuccess={onUpdate}
            />
        </div>
    );
}
