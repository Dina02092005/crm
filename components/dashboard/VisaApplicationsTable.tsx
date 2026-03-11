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
import { VisaStatus } from "@/lib/enums";
import { useUpdateVisaApplication } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useRolePath } from "@/hooks/use-role-path";
import { toast } from "sonner";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface VisaApplicationsTableProps {
    data: any[];
    onUpdate: () => void;
    onDelete: (id: string) => void;
    onOpenHistory?: (app: any) => void;
    onOpenComments?: (app: any) => void;
    onOpenOfferLetters?: (app: any) => void;
    onOpenNotes?: (app: any) => void;
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
    selectedIds = [],
    onSelectionChange = () => { },
    pagination
}: VisaApplicationsTableProps) {
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const updateMutation = useUpdateVisaApplication();

    const getStatusVariant = (status: VisaStatus) => {
        const variants: Record<string, string> = {
            VISA_GRANTED: "bg-emerald-50 text-emerald-600 border-emerald-100",
            VISA_APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-100",
            VISA_REFUSED: "bg-rose-50 text-rose-600 border-rose-100",
            VISA_REJECTED: "bg-rose-50 text-rose-600 border-rose-100",
            VISA_APPLICATION_SUBMITTED: "bg-blue-50 text-blue-600 border-blue-100",
            UNDER_REVIEW: "bg-purple-50 text-purple-600 border-purple-100",
            DOCUMENTS_PENDING: "bg-orange-50 text-orange-600 border-orange-100",
        };
        return variants[status] || "bg-slate-50 text-slate-500 border-slate-100";
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

    return (
        <div className="relative border rounded-xl overflow-hidden bg-background shadow-sm shadow-slate-200/50">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="w-[300px] pl-6 font-bold uppercase text-[10px] tracking-widest text-slate-400">Student & Visa Type</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Destination</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Status</TableHead>
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
                                router.push(prefixPath(`/visa-applications/${app.id}`));
                            }}
                        >
                            <TableCell className="pl-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm shrink-0">
                                        <AvatarFallback className="rounded-xl bg-indigo-50 text-indigo-600 text-xs font-black uppercase">
                                            {app.student?.name?.charAt(0) || "S"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm text-slate-900 truncate uppercase tracking-tight">{app.student?.name || "N/A"}</span>
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
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                                        <Globe className="h-3 w-3 text-slate-300" />
                                        {app.university?.name || "Global University"}
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
                                    <SelectContent className="rounded-xl border-slate-100 shadow-xl max-h-[300px]">
                                        {Object.values(VisaStatus).map(s => (
                                            <SelectItem key={s} value={s} className="text-[10px] font-black uppercase py-2">
                                                {s.replace(/_/g, ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                        <Calendar className="h-3 w-3 text-slate-300" />
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-slate-50 rounded-lg">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-100 shadow-xl p-1">
                                            <DropdownMenuItem onClick={() => router.push(prefixPath(`/visa-applications/${app.id}`))}>
                                                <Eye className="h-4 w-4 mr-2 text-slate-400" /> Detailed View
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onOpenHistory?.(app)}>
                                                <History className="h-4 w-4 mr-2 text-slate-400" /> Visa History
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onOpenNotes?.(app)}>
                                                <StickyNote className="h-4 w-4 mr-2 text-slate-400" /> Case Notes
                                            </DropdownMenuItem>
                                            <div className="h-px bg-slate-100 my-1" />
                                            <DropdownMenuItem onClick={async () => {
                                                try {
                                                    await updateMutation.mutateAsync({ id: app.id, data: { status: "DEFERRED" as any } });
                                                    toast.success("Deferred successfully");
                                                    onUpdate();
                                                } catch (e) { toast.error("Failed to defer"); }
                                            }} className="text-pink-600">
                                                <ArrowRightLeft className="h-4 w-4 mr-2" /> Defer Case
                                            </DropdownMenuItem>
                                            <div className="h-px bg-slate-100 my-1" />
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
                            <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mb-2">
                                        <Plane className="h-6 w-6 text-slate-200" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">No visa applications</span>
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
        </div>
    );
}
