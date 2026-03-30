"use client";

import { Fragment, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
    Phone,
    Globe,
    Eye,
    Undo2,
    Calendar,
    GraduationCap,
    Users,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRolePath } from "@/hooks/use-role-path";
import axios from "axios";
import { toast } from "sonner";
import { Application } from "@/types/api";
import { ApplicationStatus } from "@/lib/enums";
import { useUpdateApplication } from "@/hooks/useApi";
import { format } from "date-fns";
import { MoveToVisaModal } from "@/components/applications/MoveToVisaModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
    const [updatingRecordId, setUpdatingRecordId] = useState<string | null>(null);
    
    // Default expanding the first student if there's only a few
    const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});

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

    const getStatusVariant = (status: string) => {
        const variants: Record<string, string> = {
            PENDING: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
            SUBMITTED: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
            APPLIED: "bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800",
            FINALIZED: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
            UNDER_REVIEW: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
            OFFER_RECEIVED: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
            READY_FOR_VISA: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
            VISA_PROCESS: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
            ENROLLED: "bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
            DEFERRED: "bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
            REJECTED: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
        };
        return variants[status] || "bg-slate-50 text-slate-500 border-slate-100 dark:bg-transparent dark:text-slate-400 dark:border-white/10";
    };

    const handleStatusChange = async (appId: string, newStatus: string) => {
        setUpdatingRecordId(appId);
        try {
            await updateMutation.mutateAsync({
                id: appId,
                data: { status: newStatus as ApplicationStatus }
            });
            onUpdate?.();
            toast.success("Status updated successfully");
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setUpdatingRecordId(null);
        }
    };

    const toggleStudent = (studentId: string) => {
        setExpandedStudents(prev => ({
            ...prev,
            [studentId]: !prev[studentId]
        }));
    };

    // Filter out applications that have moved to the Visa module
    const filteredData = data.filter(app => !["READY_FOR_VISA", "VISA_PROCESS"].includes(app.status));

    // Group applications by studentId
    const groupedApplications = Object.values(
        filteredData.reduce((acc, app) => {
            if (!acc[app.studentId]) {
                acc[app.studentId] = {
                    studentId: app.studentId,
                    student: app.student,
                    applications: []
                };
            }
            acc[app.studentId].applications.push(app);
            return acc;
        }, {} as Record<string, { studentId: string; student: any; applications: Application[] }>)
    );

    const [selectedIdsLocal, setSelectedIdsLocal] = useState<Set<string>>(new Set());
    const activeSelectedIds = selectedIds.length > 0 ? new Set(selectedIds) : selectedIdsLocal;

    const toggleSelectAll = () => {
        if (activeSelectedIds.size === groupedApplications.length) {
            setSelectedIdsLocal(new Set());
            onSelectionChange([]);
        } else {
            const allIds = groupedApplications.map(g => g.studentId);
            setSelectedIdsLocal(new Set(allIds));
            onSelectionChange(allIds);
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(activeSelectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIdsLocal(newSelected);
        onSelectionChange(Array.from(newSelected));
    };

    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

    const handleBulkDelete = async () => {
        const applicationIdsToDelete: string[] = [];
        activeSelectedIds.forEach(studentId => {
            const group = groupedApplications.find(g => g.studentId === studentId);
            if (group) {
                group.applications.forEach(app => applicationIdsToDelete.push(app.id));
            }
        });

        if (applicationIdsToDelete.length === 0) return;

        try {
            await axios.delete("/api/applications/bulk", { data: { ids: applicationIdsToDelete } });
            toast.success(`${applicationIdsToDelete.length} applications deleted successfully`);
            setSelectedIdsLocal(new Set());
            onSelectionChange([]);
            onUpdate();
        } catch (error) {
            toast.error("Failed to delete applications");
        } finally {
            setBulkDeleteDialogOpen(false);
        }
    };

    return (
        <div className="relative border dark:border-white/5 rounded-xl overflow-hidden bg-white dark:bg-transparent shadow-sm">
            {activeSelectedIds.size > 0 && (
                <div className="absolute top-0 inset-x-0 h-12 bg-primary text-primary-foreground flex items-center justify-between px-4 z-20">
                    <span className="text-[11px] font-bold uppercase tracking-wider">{activeSelectedIds.size} students selected</span>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => { setSelectedIdsLocal(new Set()); onSelectionChange([]); }} className="h-8 text-[10px] font-bold uppercase">Deselect All</Button>
                        <Button variant="destructive" size="sm" onClick={() => setBulkDeleteDialogOpen(true)} className="h-8 text-[10px] font-bold uppercase">Bulk Delete</Button>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={bulkDeleteDialogOpen}
                onClose={() => setBulkDeleteDialogOpen(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Delete Applications"
                description={`Are you sure you want to delete all applications for the ${activeSelectedIds.size} selected students? This action cannot be undone.`}
                confirmText="Delete All"
                variant="destructive"
            />
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="w-12 px-4 border-r dark:border-slate-800">
                            <Checkbox 
                                checked={groupedApplications.length > 0 && activeSelectedIds.size === groupedApplications.length}
                                onCheckedChange={toggleSelectAll}
                            />
                        </TableHead>
                        <TableHead className="w-[300px] pl-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Student & Course</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Country & Intake</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Status</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Team / Flow</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Timeline</TableHead>
                        <TableHead className="text-right pr-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groupedApplications.map((group) => {
                        // Determine if it should be expanded. By default, maybe expand all? Or just user-toggled.
                        // Let's default to expanded if only a few students, but since we track clicks, we'll check state.
                        // If undefined, we can default to true for better UX.
                        const isExpanded = expandedStudents[group.studentId] !== false;

                        return (
                            <Fragment key={group.studentId}>
                                {/* Student Header Row */}
                                <TableRow 
                                    className="bg-muted/40 dark:bg-white/5 hover:bg-muted/60 dark:hover:bg-white/10 cursor-pointer border-b border-t transition-colors"
                                    onClick={(e) => {
                                        // Don't toggle if clicking on avatar to go to profile
                                        const target = e.target as HTMLElement;
                                        if (target.closest('.student-link') || target.closest('[role="checkbox"]')) return;
                                        toggleStudent(group.studentId);
                                    }}
                                >
                                    <TableCell className="px-4 border-r dark:border-slate-800">
                                        <Checkbox 
                                            checked={activeSelectedIds.has(group.studentId)}
                                            onCheckedChange={() => toggleSelect(group.studentId)}
                                        />
                                    </TableCell>
                                    <TableCell colSpan={6} className="py-3 pl-6">
                                        <div className="flex items-center justify-between">
                                            <div 
                                                className="flex items-center gap-4 student-link cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => router.push(prefixPath(`/students/${group.studentId}?tab=applications`))}
                                            >
                                                <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm shrink-0">
                                                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xs font-black uppercase">
                                                        {group.student?.name?.charAt(0) || "S"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-foreground truncate uppercase tracking-tight">{group.student?.name || "N/A"}</span>
                                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{group.applications.length} Application{group.applications.length > 1 ? 's' : ''}</span>
                                                </div>
                                            </div>
                                            <div className="pr-6 text-muted-foreground flex items-center gap-3">
                                                <Button size="sm" variant="ghost" className="h-8 text-[10px] uppercase font-bold text-primary hover:bg-primary/10 student-link" onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(prefixPath(`/students/${group.studentId}?tab=applications`));
                                                }}>
                                                    View Profile
                                                </Button>
                                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>

                                {/* Application Rows */}
                                {isExpanded && group.applications.map((app) => (
                                    <TableRow 
                                        key={app.id} 
                                        className="group cursor-pointer hover:bg-muted/10 dark:hover:bg-white/5 transition-colors border-b last:border-0"
                                        onClick={(e) => {
                                            const target = e.target as HTMLElement;
                                            if (target.closest('button, [role="combobox"], [role="checkbox"], .select-trigger, [role="menuitem"]')) {
                                                return;
                                            }
                                            router.push(prefixPath(`/applications/${app.id}`));
                                        }}
                                    >
                                        <TableCell className="w-12 px-4 border-r dark:border-slate-800" />
                                        <TableCell className="pl-6">
                                            <div className="flex flex-col min-w-0 pl-10 relative before:absolute before:left-6 before:top-[-20px] before:bottom-1/2 before:w-px before:bg-border after:absolute after:left-6 after:top-1/2 after:w-5 after:h-px after:bg-border">
                                                <span className="font-bold text-[13px] text-foreground/90 truncate uppercase tracking-tight">{app.course?.name || app.intendedCourse || "General Course"}</span>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mt-0.5 truncate">
                                                    <GraduationCap className="h-3 w-3 text-slate-400" />
                                                    {app.university?.name || (app as any).universityName || "No University"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/70 dark:text-slate-300">
                                                    <Globe className="h-3 w-3 text-slate-400" />
                                                    {app.country?.name || "Global"}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                                    <Calendar className="h-3 w-3 text-slate-400" />
                                                    {app.intake || "N/A Intake"}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Select 
                                                value={app.status || "PENDING"} 
                                                onValueChange={(v) => handleStatusChange(app.id, v)}
                                                disabled={updatingRecordId === app.id}
                                            >
                                                <SelectTrigger className={cn(
                                                    "h-8 w-[160px] px-3 py-0 text-[10px] font-black uppercase border-0 shadow-none transition-all rounded-lg focus:ring-1 focus:ring-primary/20",
                                                    getStatusVariant(app.status),
                                                    updatingRecordId === app.id ? "opacity-50 cursor-not-allowed" : ""
                                                )}>
                                                    {updatingRecordId === app.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                                            <span>Updating...</span>
                                                        </div>
                                                    ) : (
                                                        <SelectValue />
                                                    )}
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border shadow-xl">
                                                    {Object.values(ApplicationStatus).map(s => (
                                                        <SelectItem key={s} value={s} className="text-[10px] font-black uppercase py-2">
                                                            {s.replace(/_/g, ' ')}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col min-w-0 gap-1">
                                                <div className="text-[11px] font-bold text-foreground/80 truncate flex items-center gap-1.5">
                                                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">To:</span>
                                                    {app.assignedTo?.name || "Unassigned"}
                                                </div>
                                                <div className="text-[11px] font-medium text-muted-foreground/60 truncate flex items-center gap-1.5">
                                                    <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-black">By:</span>
                                                    {app.assignedBy?.name || "System"}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/70 dark:text-slate-300">
                                                    <Calendar className="h-3 w-3 text-slate-400" />
                                                    {format(new Date(app.createdAt), "dd MMM, yy")}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                                                    <Clock className="h-3 w-3 text-slate-400" />
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
                                                        app.status === "READY_FOR_VISA" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800" :
                                                        "bg-white dark:bg-transparent text-slate-300 dark:text-white/20 border-slate-100 dark:border-white/5 cursor-not-allowed"
                                                    )}
                                                >
                                                    <Plane className="h-3.5 w-3.5 mr-1" />
                                                    {app.status === "READY_FOR_VISA" ? "Visa Out" : "Visa"}
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted dark:hover:bg-white/5 rounded-lg">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 rounded-xl border-border shadow-xl p-1">
                                                        <DropdownMenuItem onClick={() => onOpenComments?.(app)}>
                                                            <Eye className="h-4 w-4 mr-2 text-slate-400" /> View History
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onOpenNotes?.(app)}>
                                                            <Plus className="h-4 w-4 mr-2 text-slate-400" /> Add Notes ({app._count?.notes || 0})
                                                        </DropdownMenuItem>
                                                        <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />
                                                        <DropdownMenuItem onClick={() => handleStatusChange(app.id, "APPLIED")}>
                                                            <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> Application
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(app.id, "VISA_PROCESS")}>
                                                            <Plane className="h-4 w-4 mr-2 text-indigo-500" /> Visa Process
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(app.id, "DEFERRED")}>
                                                            <History className="h-4 w-4 mr-2 text-pink-500" /> Defer
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(app.id, "ENROLLED")}>
                                                            <GraduationCap className="h-4 w-4 mr-2 text-cyan-500" /> Enrolled
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
                            </Fragment>
                        );
                    })}
                    {data.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-64 text-center text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-12 w-12 rounded-full bg-muted dark:bg-white/5 flex items-center justify-center border border-border dark:border-white/5 mb-2">
                                        <Users className="h-6 w-6 text-muted-foreground/30" />
                                    </div>
                                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No matching applications</span>
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
                        <div className="flex items-center gap-3 border-l pl-8 border-border dark:border-white/5">
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
                            Next <ChevronRight className="h-4 w-4 ml-2 text-muted-foreground" />
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
