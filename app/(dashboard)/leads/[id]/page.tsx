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
    Calendar,
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
    UserPlus
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
import { Label } from "@/components/ui/label";


export default function LeadDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession() as any;
    const [lead, setLead] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");
    const [employees, setEmployees] = useState<any[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);

    // Modal states
    const [showProposalDialog, setShowProposalDialog] = useState(false);
    const [showReminderDialog, setShowReminderDialog] = useState(false);
    const [activeTaskForReminder, setActiveTaskForReminder] = useState<any>(null);
    const [editingReminder, setEditingReminder] = useState<any>(null);
    const [editingItem, setEditingItem] = useState<any>(null); // For notes/activities

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
        setShowReminderDialog(true);
    };

    const openEditReminder = (reminder: any) => {
        setEditingReminder(reminder);
        setActiveTaskForReminder(null);
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
            {/* Top Navigation Tabs */}
            <div className="bg-card border-b border-border px-4 sm:px-8 py-2 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-1 min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                ? "bg-muted text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/leads")}
                        className="rounded-xl text-muted-foreground hover:text-foreground px-0"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads
                    </Button>
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="rounded-lg border-cyan-500/20 text-cyan-600 dark:text-cyan-400 h-10 gap-2 hover:bg-cyan-500/10 bg-card"
                            onClick={() => handleLogActivity('CALL', 'First contact call', true)}
                        >
                            <Phone className="h-4 w-4" /> Log Call
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-lg border-teal-500/20 text-teal-600 dark:text-teal-400 h-10 gap-2 hover:bg-teal-500/10 bg-card"
                            onClick={() => handleLogActivity('WHATSAPP', 'Sent WhatsApp message', true)}
                        >
                            <MessageSquare className="h-4 w-4" /> WhatsApp
                        </Button>

                        <div className="w-px h-6 bg-border mx-1" />

                        <Button
                            className="rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white h-10 gap-2 shadow-sm"
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
                            <Zap className="h-4 w-4" /> Convert to Customer
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-lg h-10 w-10 border border-border bg-card">
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl border-border shadow-xl">
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-700 focus:bg-red-50 gap-2 font-bold cursor-pointer"
                                    disabled={lead.status === 'CONVERTED' || lead.status === 'LOST'}
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
                                    <Flame className="h-4 w-4" /> Mark as Lost
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="rounded-lg border-border h-10 gap-2 hover:bg-muted bg-card" disabled={isAssigning}>
                                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                                        {isAssigning ? "Assigning..." : "Assign To"}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-xl p-1 shadow-xl border-border">
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Employee</div>
                                    {employees.length === 0 ? (
                                        <div className="px-2 py-3 text-sm text-muted-foreground text-center italic">No employees found</div>
                                    ) : (
                                        employees.map((emp) => (
                                            <DropdownMenuItem
                                                key={emp.id}
                                                className="rounded-lg cursor-pointer"
                                                onClick={() => handleAssign(emp.id)}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{emp.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{emp.email}</span>
                                                </div>
                                            </DropdownMenuItem>
                                        ))
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}


                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-lg border-border h-10 w-10 hover:bg-muted"
                            onClick={() => router.push(`/leads/${params.id}/edit`)}
                        >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="rounded-lg border-border h-10 gap-2 hover:bg-muted">
                                    More <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl border-border">
                                <DropdownMenuItem className="rounded-lg cursor-pointer">Export detail</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg cursor-pointer">Archive lead</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg cursor-pointer text-red-600">Delete lead</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="pt-4">
                    {activeTab === "profile" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column: Lead Information */}
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6 border-l-4 border-cyan-500 pl-4">Lead Information</h3>
                                    <div className="space-y-6 bg-card p-6 rounded-2xl shadow-sm border border-border">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Name</label>
                                                <p className="text-foreground font-medium text-lg italic">{lead.name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Position</label>
                                                <p className="text-muted-foreground">-</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address</label>
                                            <p className="text-blue-500 dark:text-blue-400 font-medium underline decoration-blue-500/20 underline-offset-4">{lead.email || "-"}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Website</label>
                                                <p className="text-muted-foreground">-</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Phone</label>
                                                <p className="text-foreground font-medium">{lead.phone || "-"}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Lead value</label>
                                                <p className="text-cyan-600 dark:text-cyan-400 font-bold">$0.00</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Company</label>
                                                <p className="text-muted-foreground">-</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1 pt-2 border-t border-border">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">Address Details</label>
                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Street</p>
                                                    <p className="text-sm font-medium text-foreground">-</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">City</p>
                                                    <p className="text-sm font-medium text-foreground">-</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">State</p>
                                                    <p className="text-sm font-medium text-foreground">-</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Zip Code</p>
                                                    <p className="text-sm font-medium text-foreground">-</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: General Information */}
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4">General Information</h3>
                                    <div className="space-y-6 bg-card p-6 rounded-2xl shadow-sm border border-border">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                                                <div>
                                                    <Badge className={`rounded-lg py-1 px-3 text-xs font-bold border-none ${lead.status === 'CONVERTED' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' :
                                                        lead.status === 'LOST' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                                                            lead.status === 'ASSIGNED' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                                                lead.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                                    'bg-muted text-muted-foreground'
                                                        }`}>
                                                        {lead.status}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Temperature</label>
                                                <div className="flex gap-2">
                                                    {[
                                                        { label: 'COLD', color: 'blue', value: 'COLD' },
                                                        { label: 'WARM', color: 'amber', value: 'WARM' },
                                                        { label: 'HOT', color: 'red', value: 'HOT' }
                                                    ].map((t) => (
                                                        <button
                                                            key={t.value}
                                                            onClick={async () => {
                                                                try {
                                                                    await axios.patch(`/api/leads/${params.id}`, { temperature: t.value });
                                                                    toast.success(`Marked as ${t.label}`);
                                                                    fetchLead();
                                                                    // Also log activity manually or via API
                                                                    await axios.post(`/api/leads/${params.id}/activities`, {
                                                                        type: 'TEMPERATURE_CHANGE',
                                                                        content: `Temperature changed to ${t.label}`
                                                                    });
                                                                } catch (error) {
                                                                    toast.error("Update failed");
                                                                }
                                                            }}
                                                            className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-bold transition-all border ${lead.temperature === t.value
                                                                ? `bg-${t.color}-500 text-white border-${t.color}-500 shadow-md scale-105`
                                                                : `bg-card text-${t.color}-500 border-${t.color}-500/20 hover:bg-${t.color}-500/10`
                                                                }`}
                                                        >
                                                            {t.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Source</label>
                                                <p className="text-foreground font-semibold capitalize flex items-center gap-2">
                                                    <Zap className="h-3 w-3 text-yellow-500" />
                                                    {lead.source?.toLowerCase().replace('_', ' ') || "Direct call"}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Assigned</label>
                                                <p className="text-foreground font-medium flex items-center gap-2">
                                                    {lead.assignments && lead.assignments.length > 0 ? (
                                                        <>
                                                            <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold uppercase">
                                                                {lead.assignments[lead.assignments.length - 1].employee.name.charAt(0)}
                                                            </div>
                                                            {lead.assignments[lead.assignments.length - 1].employee.name}
                                                        </>
                                                    ) : (
                                                        "Not Assigned"
                                                    )}
                                                </p>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Public</label>
                                                <p className="text-red-500 font-bold">No</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">Tags</label>
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                <Badge variant="outline" className="bg-muted text-muted-foreground border-border rounded-md px-2 py-0.5 text-[10px] uppercase font-bold tracking-tighter">android</Badge>
                                                <Badge variant="outline" className="bg-muted text-muted-foreground border-border rounded-md px-2 py-0.5 text-[10px] uppercase font-bold tracking-tighter">ios app</Badge>
                                                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md hover:bg-muted">
                                                    <UserPlus className="h-3 w-3 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6 pt-2 border-t border-border">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Created</label>
                                                <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                                                    <Clock className="h-3 w-3" />
                                                    {formatRelativeTime(lead.createdAt)}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Last Contact</label>
                                                <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatRelativeTime(lead.updatedAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "proposals" && (
                        <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold text-foreground flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-500" /> Proposals & Quotations
                                </h3>
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20">
                                        {lead.documents?.filter((d: any) => d.type === 'QUOTATION').length || 0} Proposals
                                    </Badge>
                                    <Button
                                        onClick={() => setShowProposalDialog(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-sm"
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
                                                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
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
                                    <CheckSquare className="h-5 w-5 text-emerald-500" /> Pending Tasks
                                </h3>
                                <div className="flex gap-2">
                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20">
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
                                    <div className="flex gap-2">
                                        <div className="flex flex-col flex-1">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-2 mb-1">Due Date</label>
                                            <input
                                                name="dueAt"
                                                type="datetime-local"
                                                required
                                                className="bg-card border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-2 mb-1">Reminder</label>
                                            <input
                                                name="remindAt"
                                                type="datetime-local"
                                                className="bg-card border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 font-bold">
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
                                                        <Calendar className="h-3 w-3" /> Due {new Date(task.dueAt).toLocaleString()}
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
                                                    className="h-8 rounded-xl text-xs gap-1 text-blue-500 hover:bg-blue-500/10"
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
                                    <Paperclip className="h-5 w-5 text-blue-500" /> Lead Documents
                                </h3>
                                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20">
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
                                            <div className="w-12 h-12 rounded-2xl mb-4 bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
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
                                    <Bell className="h-5 w-5 text-amber-500" /> Reminders
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
                            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                                <h3 className="font-bold text-foreground">Internal Notes</h3>
                                <Badge className="bg-muted text-muted-foreground hover:bg-muted">
                                    {lead.activities?.filter((a: any) => a.type === 'NOTE').length || 0} Notes
                                </Badge>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {lead.activities?.filter((a: any) => a.type === 'NOTE').length > 0 ? (
                                    lead.activities
                                        .filter((a: any) => a.type === 'NOTE')
                                        .map((note: any, idx: number) => (
                                            <div key={idx} className="flex gap-3 group">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                    {note.user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="bg-muted/50 p-4 rounded-2xl rounded-tl-none flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-foreground">{note.user?.name || 'User'}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-muted-foreground">{formatRelativeTime(note.createdAt)}</span>
                                                            {session?.user?.id === note.userId && (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={() => setEditingItem(note)}
                                                                    >
                                                                        <Pencil className="h-3 w-3" />
                                                                    </Button>
                                                                    {session?.user?.role === 'ADMIN' && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 rounded-lg text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            onClick={() => handleDeleteActivity(note.id)}
                                                                        >
                                                                            <Pencil className="h-3 w-3" />
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">{note.content}</p>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                        <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
                                        <p className="text-sm italic">No notes added yet</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-border bg-muted/30">
                                <form onSubmit={(e: any) => {
                                    // ...
                                    e.preventDefault();
                                    const content = e.target.note.value;
                                    if (content) {
                                        handleLogActivity('NOTE', content);
                                        e.target.reset();
                                    }
                                }} className="flex gap-2">
                                    <textarea
                                        name="note"
                                        placeholder="Add a note..."
                                        className="flex-1 bg-card border border-border rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-12"
                                    />
                                    <Button type="submit" className="rounded-2xl h-12 w-12 bg-blue-600 hover:bg-blue-700" size="icon">
                                        <Zap className="h-4 w-4 text-white" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === "activity" && (
                        <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold text-foreground flex items-center gap-2">
                                    <History className="h-5 w-5 text-purple-500" /> Activity Timeline
                                </h3>
                                <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20">
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
                                                        className="rounded-xl h-8 w-8 text-blue-500 hover:bg-blue-500/10"
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
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
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
                                <Label htmlFor="remindAt">Remind At</Label>
                                <Input
                                    id="remindAt"
                                    name="remindAt"
                                    type="datetime-local"
                                    required
                                    className="bg-card border-border"
                                    defaultValue={editingReminder ? new Date(editingReminder.remindAt).toISOString().slice(0, 16) : ""}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowReminderDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
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
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
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
        </div>
    );
}
