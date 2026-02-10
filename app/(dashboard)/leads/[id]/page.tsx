"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Phone,
    Mail,
    Calendar as CalendarIcon,
    MapPin,
    User,
    ArrowLeft,
    MessageSquare,
    Clock,
    Flame,
    Zap,
    Briefcase,
    Globe,
    Building2,
    FileText,
    CheckSquare,
    Paperclip,
    Bell,
    History,
    MoreHorizontal,
    Pencil,
    UserPlus,
    Trash2,
    Plus,
    Database
} from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { LeadForm } from "@/components/dashboard/LeadForm";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";





export default function LeadDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession() as any;
    const [lead, setLead] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");
    const [employees, setEmployees] = useState<any[]>([]);

    // DateTimePicker states
    const [taskDueDate, setTaskDueDate] = useState<Date | undefined>();
    const [taskRemindAt, setTaskRemindAt] = useState<Date | undefined>();
    const [dialogRemindAt, setDialogRemindAt] = useState<Date | undefined>();
    const [isAssigning, setIsAssigning] = useState(false);

    // Modal states
    const [showProposalDialog, setShowProposalDialog] = useState(false);
    const [showReminderDialog, setShowReminderDialog] = useState(false);
    const [activeTaskForReminder, setActiveTaskForReminder] = useState<any>(null);
    const [editingReminder, setEditingReminder] = useState<any>(null);
    const [editingItem, setEditingItem] = useState<any>(null); // For notes/activities
    const [editSheetOpen, setEditSheetOpen] = useState(false);

    // Confirm Dialog State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        description: "",
        confirmText: "Confirm",
        variant: "default" as "default" | "destructive",
        onConfirm: async () => { },
        isLoading: false,
    });

    const openConfirm = (
        title: string,
        description: string,
        onConfirm: () => Promise<void>,
        variant: "default" | "destructive" = "default",
        confirmText = "Confirm"
    ) => {
        setConfirmConfig({
            isOpen: true,
            title,
            description,
            confirmText,
            variant,
            onConfirm,
            isLoading: false,
        });
    };

    const handleConfirmAction = async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        try {
            await confirmConfig.onConfirm();
            setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error("Confirmation action failed", error);
        } finally {
            setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        }
    };

    const formatRelativeTime = (date: string | Date) => {
        const d = new Date(date);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return d.toLocaleDateString();
    };

    const fetchLead = async () => {
        try {
            const response = await axios.get(`/api/leads/${params.id}`);
            setLead(response.data);
        } catch (error) {
            toast.error("Failed to fetch lead details");
            router.push("/leads");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEmployees = async () => {
        if (session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') {
            try {
                const response = await axios.get('/api/employees');
                setEmployees(response.data.employees || []);
            } catch (error) {
                console.error("Failed to fetch employees");
            }
        }
    };

    const handleAssign = async (employeeId: string) => {
        setIsAssigning(true);
        try {
            await axios.patch(`/api/leads/${params.id}`, { assignedTo: employeeId });
            toast.success("Lead assigned successfully");
            fetchLead();
        } catch (error) {
            toast.error("Failed to assign lead");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleLogActivity = async (type: string, content: string, updateLead: boolean = false) => {
        try {
            await axios.post(`/api/leads/${params.id}/activities`, { type, content, updateLead });
            toast.success(`${type} logged successfully`);
            fetchLead();
        } catch (error) {
            toast.error("Failed to log activity");
        }
    };

    // CRUD Handlers
    const handleDeleteDocument = (docId: string) => {
        openConfirm(
            "Delete Document",
            "Are you sure you want to delete this document?",
            async () => {
                try {
                    await axios.delete(`/api/leads/${params.id}/documents?documentId=${docId}`);
                    toast.success('Document deleted');
                    fetchLead();
                } catch (error) {
                    toast.error('Failed to delete');
                }
            },
            "destructive",
            "Delete"
        );
    };

    const handleDeleteReminder = (reminderId: string) => {
        openConfirm(
            "Delete Reminder",
            "Are you sure you want to delete this reminder?",
            async () => {
                try {
                    await axios.delete(`/api/leads/${params.id}/reminders?reminderId=${reminderId}`);
                    toast.success('Reminder deleted');
                    fetchLead();
                } catch (error) {
                    toast.error('Failed to delete');
                }
            },
            "destructive",
            "Delete"
        );
    };

    const handleSaveReminder = async (e: any) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const remindAt = formData.get('remindAt') as string;

        if (!remindAt) {
            toast.error("Please select a time");
            return;
        }

        try {
            if (editingReminder) {
                await axios.patch(`/api/leads/${params.id}/reminders`, {
                    reminderId: editingReminder.id,
                    remindAt
                });
                toast.success('Reminder updated');
                await axios.post(`/api/leads/${params.id}/reminders`, {
                    taskId: activeTaskForReminder.id,
                    remindAt
                });
                toast.success('Reminder set');
            } else {
                toast.error("No task selected for reminder");
                console.error("Missing state:", { editingReminder, activeTaskForReminder });
            }
            setShowReminderDialog(false);
            setEditingReminder(null);
            setActiveTaskForReminder(null);
            fetchLead();
        } catch (error) {
            toast.error('Failed to save reminder');
        }
    };

    const openCreateReminder = (task: any) => {
        setActiveTaskForReminder(task);
        setEditingReminder(null);
        setDialogRemindAt(undefined);
        setShowReminderDialog(true);
    };

    const openEditReminder = (reminder: any) => {
        setEditingReminder(reminder);
        setActiveTaskForReminder(null);
        setDialogRemindAt(new Date(reminder.remindAt));
        setShowReminderDialog(true);
    };

    const handleEditNote = async (activityId: string, content: string) => {
        try {
            await axios.patch(`/api/leads/${params.id}/activities`, { activityId, content });
            toast.success('Note updated');
            setEditingItem(null);
            fetchLead();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const handleDeleteActivity = (activityId: string) => {
        openConfirm(
            "Delete Activity",
            "Are you sure you want to delete this activity?",
            async () => {
                try {
                    await axios.delete(`/api/leads/${params.id}/activities?activityId=${activityId}`);
                    toast.success('Activity deleted');
                    fetchLead();
                } catch (error) {
                    toast.error('Failed to delete');
                }
            },
            "destructive",
            "Delete"
        );
    };

    const handleEditActivity = async (activityId: string, content: string) => {
        try {
            await axios.patch(`/api/leads/${params.id}/activities`, { activityId, content });
            toast.success('Activity updated');
            setEditingItem(null);
            fetchLead();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    useEffect(() => {
        fetchLead();
    }, [params.id]);


    useEffect(() => {
        if (session) fetchEmployees();
    }, [session]);


    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-64 rounded-3xl" />
            </div>
        );
    }

    const tabs = [
        { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
        { id: "proposals", label: "Proposals", icon: <FileText className="h-4 w-4" /> },
        { id: "tasks", label: "Tasks", icon: <CheckSquare className="h-4 w-4" /> },
        { id: "attachments", label: "Attachments", icon: <Paperclip className="h-4 w-4" /> },
        { id: "reminders", label: "Reminders", icon: <Bell className="h-4 w-4" /> },
        { id: "notes", label: "Notes", icon: <MessageSquare className="h-4 w-4" /> },
        { id: "activity", label: "Activity Log", icon: <History className="h-4 w-4" /> },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Top Navigation Tabs - Using the pill style from Leads page */}
            <div className="bg-background px-4 sm:px-8 py-3 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                px-4 py-1.5 rounded-xl flex items-center gap-2 transition-all
                                ${activeTab === tab.id
                                    ? "bg-teal-500/10 shadow-sm ring-1 ring-inset ring-teal-500/30 text-teal-600"
                                    : "bg-card hover:bg-muted/50 text-muted-foreground"
                                }
                            `}
                        >
                            <span className={activeTab === tab.id ? "text-primary" : "text-muted-foreground"}>
                                {tab.icon}
                            </span>
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === tab.id ? "text-primary" : "text-muted-foreground"}`}>
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
                {/* Back Button */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl h-8 w-8 hover:bg-muted"
                        onClick={() => router.push("/leads")}
                    >
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Lead Details</h1>
                        <p className="text-xs text-muted-foreground">Comprehensive view of lead information and activity</p>
                    </div>
                </div>

                {activeTab === "profile" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Lead Profile Card - Matching Customer style */}
                        <div className="col-span-1 space-y-6">
                            <Card className="border border-border rounded-2xl bg-card shadow-none">
                                <CardHeader className="pb-2 border-b border-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                                            {lead.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead</p>
                                            <CardTitle className="text-lg font-bold">{lead.name}</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 space-y-5">
                                    <div className="grid gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Contact Information</p>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Phone</span>
                                                    <span className="font-semibold">{lead.phone || "-"}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Email</span>
                                                    <span className="font-semibold text-primary">{lead.email || "-"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Status & Priority</p>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Status</span>
                                                    <Badge className={`rounded-lg py-0.5 px-2 text-[10px] font-bold border-none ${lead.status === 'CONVERTED' ? 'bg-emerald-500/10 text-emerald-600' :
                                                        lead.status === 'LOST' ? 'bg-red-500/10 text-red-600' :
                                                            lead.status === 'ASSIGNED' ? 'bg-blue-500/10 text-blue-600' :
                                                                lead.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-600' :
                                                                    'bg-muted text-muted-foreground'
                                                        }`}>
                                                        {lead.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Temperature</span>
                                                    <Badge className={`rounded-lg py-0.5 px-2 text-[10px] font-bold border-none ${lead.temperature === 'HOT' ? 'bg-red-500/10 text-red-600' :
                                                        lead.temperature === 'WARM' ? 'bg-amber-500/10 text-amber-600' :
                                                            'bg-blue-500/10 text-blue-600'
                                                        }`}>
                                                        {lead.temperature}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">System Info</p>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Source</span>
                                                    <span className="font-semibold capitalize">{lead.source?.toLowerCase().replace('_', ' ') || "Direct"}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Assigned To</span>
                                                    <span className="font-semibold">
                                                        {lead.assignments?.[lead.assignments.length - 1]?.employee.name || "Unassigned"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Created</span>
                                                    <span className="font-semibold">{new Date(lead.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border/50 flex flex-col gap-2">
                                        <Button
                                            className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-9 text-sm font-bold shadow-sm"
                                            disabled={lead.status === 'CONVERTED' || lead.status === 'LOST'}
                                            onClick={() => {
                                                openConfirm(
                                                    "Convert to Customer",
                                                    "Are you sure you want to convert this lead to a customer?",
                                                    async () => {
                                                        try {
                                                            await axios.post(`/api/leads/${params.id}/convert`, { action: 'CONVERT' });
                                                            toast.success("Lead converted to customer!");
                                                            fetchLead();
                                                        } catch (error) {
                                                            toast.error("Conversion failed");
                                                        }
                                                    },
                                                    "default",
                                                    "Convert"
                                                );
                                            }}
                                        >
                                            <Zap className="h-4 w-4 mr-2" />
                                            Convert to Customer
                                        </Button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="outline"
                                                className="rounded-xl h-9 text-sm border-primary/20 text-primary hover:bg-primary/5"
                                                onClick={() => setEditSheetOpen(true)}
                                            >
                                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                                Edit
                                            </Button>
                                            {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (
                                                <Button
                                                    variant="outline"
                                                    className="rounded-xl h-9 text-sm border-primary/20 text-primary hover:bg-primary/5"
                                                    onClick={() => setIsAssigning(true)}
                                                    disabled={isAssigning}
                                                >
                                                    <UserPlus className="h-3.5 w-3.5 mr-2" />
                                                    Assign
                                                </Button>
                                            )}
                                        </div>
                                        {lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
                                            <Button
                                                variant="ghost"
                                                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl h-9 text-xs font-bold"
                                                onClick={async () => {
                                                    const reason = prompt("Enter reason for marking as LOST:");
                                                    if (reason !== null) {
                                                        try {
                                                            await axios.post(`/api/leads/${params.id}/convert`, { action: 'LOST', reason });
                                                            toast.success("Lead marked as lost");
                                                            fetchLead();
                                                        } catch (error) {
                                                            toast.error("Update failed");
                                                        }
                                                    }
                                                }}
                                            >
                                                <Flame className="h-3.5 w-3.5 mr-2" />
                                                Mark as Lost
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Interaction Bar & Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Interaction Quick Actions */}
                            <Card className="border border-border rounded-2xl bg-card shadow-none">
                                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                                    <Button
                                        variant="outline"
                                        className="rounded-xl border-primary/20 text-primary h-10 gap-2 hover:bg-primary/5 bg-card flex-1 font-bold text-xs"
                                        onClick={() => handleLogActivity('CALL', 'First contact call', true)}
                                    >
                                        <Phone className="h-4 w-4" /> Log Call
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="rounded-xl border-emerald-500/20 text-emerald-600 h-10 gap-2 hover:bg-emerald-500/10 bg-card flex-1 font-bold text-xs"
                                        onClick={() => handleLogActivity('WHATSAPP', 'Sent WhatsApp message', true)}
                                    >
                                        <MessageSquare className="h-4 w-4" /> WhatsApp
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="rounded-xl border-blue-500/20 text-blue-600 h-10 gap-2 hover:bg-blue-500/10 bg-card flex-1 font-bold text-xs"
                                        onClick={() => setShowProposalDialog(true)}
                                    >
                                        <FileText className="h-4 w-4" /> Create Proposal
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Additional Info / Address */}
                            <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden">
                                <CardHeader className="pb-2 border-b border-border/50">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-primary" /> Additional Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Lead Value</p>
                                            <p className="text-sm font-bold text-primary">$0.00</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Company Name</p>
                                            <p className="text-sm font-medium">Internal</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Position</p>
                                            <p className="text-sm font-medium">-</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">City</p>
                                            <p className="text-sm font-medium">-</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Website</p>
                                            <p className="text-sm font-medium">-</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Tags</p>
                                            <div className="flex flex-wrap gap-1">
                                                <Badge variant="secondary" className="text-[9px] font-bold uppercase px-1.5 py-0 bg-muted border-0">Android</Badge>
                                                <Badge variant="secondary" className="text-[9px] font-bold uppercase px-1.5 py-0 bg-muted border-0">iOS</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Chat / Webhook Data */}
                            {lead.data && Object.keys(lead.data as object).length > 0 && (
                                <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden">
                                    <CardHeader className="pb-2 border-b border-border/50">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Database className="h-4 w-4 text-primary" /> Submission Data
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                            {Object.entries(lead.data as object).map(([key, value]) => (
                                                <div key={key} className="space-y-1">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </p>
                                                    <p className="text-sm font-medium break-words">
                                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "proposals" && (
                    <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" /> Proposals & Quotations
                            </h3>
                            <div className="flex items-center gap-3">
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                    {lead.documents?.filter((d: any) => d.type === 'QUOTATION').length || 0} Proposals
                                </Badge>
                                <Button
                                    onClick={() => setShowProposalDialog(true)}
                                    className="bg-primary hover:bg-primary/90 text-white rounded-xl h-9 px-4 text-sm font-bold shadow-sm"
                                >
                                    + Create
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {lead.documents && lead.documents.filter((d: any) => d.type === 'QUOTATION').length > 0 ? (
                                lead.documents.filter((d: any) => d.type === 'QUOTATION').map((doc: any, idx: number) => (
                                    <div key={idx} className="p-4 rounded-3xl border border-border bg-card hover:bg-muted/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground text-sm">{doc.fileName}</p>
                                                <p className="text-xs text-muted-foreground">Uploaded {formatRelativeTime(doc.createdAt)} by {doc.user.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={doc.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-card border border-border rounded-xl h-8 px-4 text-[10px] font-bold flex items-center justify-center hover:bg-muted transition-colors"
                                            >
                                                VIEW
                                            </a>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-xl h-8 w-8 text-red-500 hover:bg-red-50"
                                                onClick={() => handleDeleteDocument(doc.id)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                    <FileText className="h-12 w-12 mb-2 opacity-20" />
                                    <p className="text-sm italic">No proposals uploaded yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "tasks" && (
                    <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <CheckSquare className="h-5 w-5 text-primary" /> Pending Tasks
                            </h3>
                            <div className="flex gap-2">
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                    {lead.tasks?.filter((t: any) => t.status === 'PENDING').length || 0} Open
                                </Badge>
                            </div>
                        </div>

                        {/* Add Task Form */}
                        <form onSubmit={async (e: any) => {
                            // ... (handlers unchanged)
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const title = formData.get('title') as string;
                            const dueAt = formData.get('dueAt') as string;
                            const remindAt = formData.get('remindAt') as string;

                            if (title && dueAt) {
                                try {
                                    await axios.post(`/api/leads/${params.id}/tasks`, {
                                        title,
                                        dueAt,
                                        remindAt: remindAt || null
                                    });
                                    toast.success("Task scheduled");
                                    fetchLead();
                                    e.target.reset();
                                    setTaskDueDate(undefined);
                                    setTaskRemindAt(undefined);
                                } catch (error) {
                                    toast.error("Failed to schedule task");
                                }
                            }
                        }} className="mb-8 p-4 bg-muted/30 rounded-2xl space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input
                                    name="title"
                                    placeholder="Task title (e.g. Call back tomorrow)"
                                    required
                                    className="bg-card border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <DateTimePicker
                                            name="dueAt"
                                            label="Due Date"
                                            required
                                            className="w-full"
                                            date={taskDueDate}
                                            setDate={setTaskDueDate}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <DateTimePicker
                                            name="remindAt"
                                            label="Reminder"
                                            className="w-full"
                                            date={taskRemindAt}
                                            setDate={setTaskRemindAt}
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-10 font-bold shadow-sm">
                                Schedule Follow-Up Task
                            </Button>
                        </form>

                        <div className="space-y-4">
                            {lead.tasks && lead.tasks.length > 0 ? (
                                lead.tasks.map((task: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 rounded-3xl border border-border bg-card hover:bg-muted/50 transition-colors group">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                            }`}>
                                            {task.status === 'COMPLETED' ? <CheckSquare className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`font-bold text-sm ${task.status === 'COMPLETED' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                                {task.title}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <CalendarIcon className="h-3 w-3" /> Due {new Date(task.dueAt).toLocaleString()}
                                                </p>
                                                {task.reminders?.length > 0 && (
                                                    <Badge variant="outline" className="text-[9px] font-bold text-amber-500 border-amber-500/20 bg-amber-500/10 gap-1 rounded-full cursor-pointer hover:bg-amber-500/20"
                                                        onClick={() => openEditReminder(task.reminders[0])} // Editing the first one for simplicity
                                                    >
                                                        <Bell className="h-2.5 w-2.5 outline-none" />
                                                        {new Date(task.reminders[0].remindAt).toLocaleString()}
                                                        <Pencil className="h-2 w-2 ml-1 opacity-50" />
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 rounded-xl text-xs gap-1 text-primary hover:bg-primary/10"
                                                onClick={() => openCreateReminder(task)}
                                            >
                                                <Bell className="h-3 w-3" /> +Reminder
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                    <CheckSquare className="h-12 w-12 mb-2 opacity-20" />
                                    <p className="text-sm italic">No tasks scheduled yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "attachments" && (
                    <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <Paperclip className="h-5 w-5 text-primary" /> Lead Documents
                            </h3>
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                {lead.documents?.length || 0} Files
                            </Badge>
                        </div>

                        {/* Upload Area */}
                        <div className="mb-8 p-6 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors group">
                            <div className="w-12 h-12 rounded-2xl bg-card shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Paperclip className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-bold text-foreground mb-1">Upload requirement or quotation</p>
                            <p className="text-xs text-muted-foreground mb-6 text-center max-w-[200px]">PDF, PNG, JPG or DOC up to 10MB</p>

                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                onChange={async (e: any) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        try {
                                            await axios.post(`/api/leads/${params.id}/documents`, formData);
                                            toast.success("Document uploaded");
                                            fetchLead();
                                        } catch (error) {
                                            toast.error("Upload failed");
                                        }
                                    }
                                }}
                            />
                            <Button
                                onClick={() => document.getElementById('file-upload')?.click()}
                                className="bg-card text-foreground border border-border hover:bg-muted rounded-xl px-6 h-10 font-bold shadow-sm"
                            >
                                Select File
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {lead.documents && lead.documents.length > 0 ? (
                                lead.documents.map((doc: any, idx: number) => (
                                    <div key={idx} className="p-4 rounded-3xl border border-border bg-card hover:bg-muted/50 transition-colors flex flex-col items-center text-center group">
                                        <div className="w-12 h-12 rounded-2xl mb-4 bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            {doc.fileName.toLowerCase().endsWith('.pdf') ? <FileText className="h-6 w-6" /> : <Paperclip className="h-6 w-6" />}
                                        </div>
                                        <p className="font-bold text-foreground text-sm truncate w-full">{doc.fileName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter rounded-full">
                                                {doc.type}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">{formatRelativeTime(doc.createdAt)}</span>
                                        </div>
                                        <div className="flex gap-2 mt-4 w-full">
                                            <a
                                                href={doc.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 bg-card border border-border rounded-xl h-8 text-[10px] font-bold flex items-center justify-center hover:bg-muted transition-colors"
                                            >
                                                VIEW
                                            </a>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-10 flex flex-col items-center justify-center text-muted-foreground">
                                    <Paperclip className="h-10 w-10 mb-2 opacity-20" />
                                    <p className="text-xs uppercase font-bold tracking-widest italic">No documents attached</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "reminders" && (
                    <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <Bell className="h-5 w-5 text-primary" /> Reminders
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {lead.tasks?.flatMap((t: any) => t.reminders || []).length > 0 ? (
                                lead.tasks.flatMap((t: any) => t.reminders || []).map((reminder: any) => (
                                    <div key={reminder.id} className="flex items-center justify-between p-4 rounded-3xl border border-border bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${new Date(reminder.remindAt) < new Date() ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                <Bell className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground text-sm">
                                                    {new Date(reminder.remindAt).toLocaleString()}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Task: {lead.tasks.find((t: any) => t.reminders?.some((r: any) => r.id === reminder.id))?.title || "Unknown Task"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-xl hover:bg-muted"
                                                onClick={() => openEditReminder(reminder)}
                                            >
                                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-xl hover:bg-red-500/10 text-red-500"
                                                onClick={() => handleDeleteReminder(reminder.id)}
                                            >
                                                <MoreHorizontal className="h-3.5 w-3.5 rotate-90" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                    <Bell className="h-12 w-12 mb-2 opacity-20" />
                                    <p className="text-sm italic">No reminders set</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {activeTab === "notes" && (
                    <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col h-[500px]">
                        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                            <h3 className="font-bold text-foreground">Internal Notes</h3>
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                {lead.activities?.filter((a: any) => a.type === 'NOTE').length || 0} Notes
                            </Badge>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                            {lead.activities?.filter((a: any) => a.type === 'NOTE').length > 0 ? (
                                lead.activities
                                    .filter((a: any) => a.type === 'NOTE')
                                    .map((note: any, idx: number) => (
                                        <div key={idx} className="bg-card border-l-4 border-l-primary border-y border-r border-border p-4 rounded-xl shadow-sm group transition-all hover:bg-muted/50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                                        {note.user?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground leading-none">{note.user?.name || 'User'}</p>
                                                        <p className="text-[9px] text-muted-foreground mt-0.5">{formatRelativeTime(note.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {session?.user?.id === note.userId && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-lg hover:bg-primary/10 text-primary"
                                                            onClick={() => setEditingItem(note)}
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    {session?.user?.role === 'ADMIN' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-lg text-red-500 hover:bg-red-500/10"
                                                            onClick={() => handleDeleteActivity(note.id)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-foreground/80 leading-relaxed">{note.content}</p>
                                        </div>
                                    ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
                                    <p className="text-sm italic">No notes added yet</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-border bg-card">
                            <form onSubmit={(e: any) => {
                                e.preventDefault();
                                const content = e.target.note.value;
                                if (content) {
                                    handleLogActivity('NOTE', content);
                                    e.target.reset();
                                }
                            }} className="flex gap-2">
                                <textarea
                                    name="note"
                                    placeholder="Add a private note..."
                                    className="flex-1 bg-muted/30 border border-border rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-12 transition-all focus:bg-background"
                                />
                                <Button type="submit" className="rounded-2xl h-12 w-12 bg-primary hover:bg-primary/90 shadow-sm" size="icon">
                                    <Plus className="h-5 w-5 text-white" />
                                </Button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === "activity" && (
                    <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" /> Activity Timeline
                            </h3>
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                {lead.activities?.length || 0} Events
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            {lead.activities && lead.activities.length > 0 ? (
                                lead.activities.map((act: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-4 p-4 rounded-3xl border border-border bg-card hover:bg-muted/50 transition-colors group">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${act.type === 'CALL' ? 'bg-emerald-500/10 text-emerald-500' :
                                            act.type === 'WHATSAPP' ? 'bg-green-500/10 text-green-500' :
                                                act.type === 'EMAIL' ? 'bg-blue-500/10 text-blue-500' :
                                                    act.type === 'NOTE' ? 'bg-purple-500/10 text-purple-500' :
                                                        'bg-muted text-muted-foreground'
                                            }`}>
                                            {act.type === 'CALL' && <Phone className="h-5 w-5" />}
                                            {act.type === 'WHATSAPP' && <MessageSquare className="h-5 w-5" />}
                                            {act.type === 'EMAIL' && <Mail className="h-5 w-5" />}
                                            {act.type === 'NOTE' && <MessageSquare className="h-5 w-5" />}
                                            {!['CALL', 'WHATSAPP', 'EMAIL', 'NOTE'].includes(act.type) && <History className="h-5 w-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tighter rounded-full border-border">
                                                    {act.type.replace('_', ' ')}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">{formatRelativeTime(act.createdAt)}</span>
                                            </div>
                                            <p className="text-sm text-foreground/80">{act.content}</p>
                                            <p className="text-xs text-muted-foreground mt-1">by {act.user?.name || 'System'}</p>
                                        </div>
                                        {/* Edit/Delete buttons for activities */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {act.type === 'NOTE' && session?.user?.id === act.userId && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-xl h-8 w-8 text-primary hover:bg-primary/10"
                                                    onClick={() => setEditingItem(act)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            {session?.user?.role === 'ADMIN' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-xl h-8 w-8 text-red-500 hover:bg-red-500/10"
                                                    onClick={() => handleDeleteActivity(act.id)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                    <History className="h-12 w-12 mb-2 opacity-20" />
                                    <p className="text-sm italic">No activity found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {/* Proposal Upload Dialog */}
            <Dialog open={showProposalDialog} onOpenChange={setShowProposalDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Proposal/Quotation</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={async (e: any) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        formData.append('type', 'QUOTATION');
                        try {
                            await axios.post(`/api/leads/${params.id}/documents`, formData);
                            toast.success('Proposal uploaded');
                            setShowProposalDialog(false);
                            fetchLead();
                            e.target.reset();
                        } catch (error) {
                            toast.error('Upload failed');
                        }
                    }}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="file">Select File</Label>
                                <Input id="file" name="file" type="file" required accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="bg-card border-border" />
                                <p className="text-xs text-muted-foreground">PDF, DOC, or Image files</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowProposalDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-sm px-6">
                                Upload
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Reminder Dialog */}
            <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingReminder ? "Edit Reminder" : `Set Reminder for ${activeTaskForReminder?.title || 'Unknown Task'}`}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveReminder}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Task</Label>
                                <p className="text-sm font-medium text-foreground">
                                    {activeTaskForReminder?.title ||
                                        (editingReminder && lead.tasks?.find((t: any) => t.reminders?.some((r: any) => r.id === editingReminder.id))?.title) ||
                                        "Unknown Task"}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <DateTimePicker
                                    name="remindAt"
                                    label="Remind At"
                                    required
                                    date={dialogRemindAt}
                                    setDate={setDialogRemindAt}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setShowReminderDialog(false); setDialogRemindAt(undefined); }}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-sm px-6">
                                Save Reminder
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Note Dialog */}
            <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit {editingItem?.type === 'NOTE' ? 'Note' : 'Activity'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e: any) => {
                        e.preventDefault();
                        const content = e.target.content.value;
                        if (content && editingItem) {
                            handleEditActivity(editingItem.id, content);
                        }
                    }}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="content">Content</Label>
                                <textarea
                                    id="content"
                                    name="content"
                                    defaultValue={editingItem?.content || ''}
                                    required
                                    rows={4}
                                    className="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-sm px-6">
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Assign Employee Dialog */}
            <Dialog open={isAssigning} onOpenChange={setIsAssigning}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Assign Lead</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">Select an employee to assign this lead to.</p>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {employees.length > 0 ? (
                                employees.map((emp: any) => (
                                    <button
                                        key={emp.id}
                                        onClick={() => handleAssign(emp.id)}
                                        className="w-full h-auto p-3 flex items-center justify-between rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                {emp.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium leading-none">{emp.name}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{emp.email}</p>
                                            </div>
                                        </div>
                                        {lead.assignments?.[lead.assignments.length - 1]?.assignedTo === emp.id && (
                                            <Badge variant="secondary" className="text-[10px]">Current</Badge>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic text-center py-4">No employees found.</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAssigning(false)}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmAction}
                title={confirmConfig.title}
                description={confirmConfig.description}
                confirmText={confirmConfig.confirmText}
                variant={confirmConfig.variant}
                isLoading={confirmConfig.isLoading}
            />

            {/* Edit Lead Sheet */}
            <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
                <SheetContent className="overflow-y-auto w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Edit Lead</SheetTitle>
                        <SheetDescription>
                            Update lead information and details.
                        </SheetDescription>
                    </SheetHeader>
                    {lead && (
                        <LeadForm
                            leadId={lead.id}
                            onSuccess={() => {
                                setEditSheetOpen(false);
                                fetchLead();
                            }}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
