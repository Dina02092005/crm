"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    GraduationCap,
    Globe,
    Clock,
    MessageSquare,
    Paperclip,
    Send,
    Loader2,
    CheckCircle2,
    History,
    FileText,
    ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";

export interface StudentApplication {
    id: string;
    university: { name: string };
    country: { name: string };
    course: { name: string };
    intake: string;
    status: string;
    agent?: { name: string };
    counselor?: { name: string };
    applicationNotes: {
        id: string;
        note: string;
        attachmentUrl?: string;
        attachmentName?: string;
        createdAt: string;
        user: { name: string, role: string };
    }[];
}

export function StudentApplicationsView() {
    const [applications, setApplications] = useState<StudentApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<StudentApplication | null>(null);
    const [newNote, setNewNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await axios.get("/api/student/applications");
            setApplications(res.data);
            if (res.data.length > 0 && !selectedApp) {
                setSelectedApp(res.data[0]);
            }
        } catch (error) {
            toast.error("Failed to fetch applications");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp || !newNote.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await axios.post("/api/student/notes", {
                applicationId: selectedApp.id,
                note: newNote
            });
            toast.success("Comment added successfully");
            setNewNote("");
            
            // Refresh applications list
            const fetchRes = await axios.get("/api/student/applications");
            setApplications(fetchRes.data);
            
            // Update selectedApp with the new data from fetchRes.data
            const updatedApp = fetchRes.data.find((a: any) => a.id === selectedApp.id);
            if (updatedApp) {
                setSelectedApp(updatedApp);
            }
        } catch (error) {
            toast.error("Failed to add comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (applications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground p-8 bg-card border border-dashed rounded-3xl">
                <FileText className="h-12 w-12 opacity-10 mb-4" />
                <h3 className="text-lg font-bold text-foreground">No Applications Yet</h3>
                <p className="text-sm">Your counselor will add applications here once your profile is verified.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Application List */}
            <div className="lg:col-span-4 space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">My Applications</h3>
                <div className="space-y-3">
                    {applications.map((app) => (
                        <div
                            key={app.id}
                            onClick={() => setSelectedApp(app)}
                            className={`
                                p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group
                                ${selectedApp?.id === app.id
                                    ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                                    : "border-border bg-card hover:border-primary/30 hover:bg-slate-50/50"}
                            `}
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-start gap-2">
                                    <h4 className="text-sm font-bold text-foreground line-clamp-1">{app.course?.name || "No Course Name"}</h4>
                                    <Badge className={`${getStatusColor(app.status)} border-none text-[9px] font-bold px-1.5 py-0.5 whitespace-nowrap`}>
                                        {app.status}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <GraduationCap className="h-3 w-3" /> {app.university?.name || "No University Name"}
                                </p>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Globe className="h-2.5 w-2.5" /> {app.country?.name || "No Country Name"}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-2.5 w-2.5" /> {app.intake}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Details & Timeline */}
            {selectedApp && (
                <div className="lg:col-span-8 space-y-6">
                    <Card className="border border-border rounded-3xl bg-card shadow-sm overflow-hidden">
                        <CardHeader className="pb-6 border-b border-border/50 bg-slate-50/20">
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        {selectedApp.course?.name || "No Course Name"}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 text-primary font-medium text-sm">
                                        {selectedApp.university?.name || "No University"} • {selectedApp.country?.name || "No Country"}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-xs">
                                        INTAKE: {selectedApp.intake}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-4">
                                    <h5 className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <History className="h-3 sm:h-4 w-3 sm:w-4 text-primary" /> Application Details
                                    </h5>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs sm:text-sm">
                                            <span className="text-muted-foreground">Assigned Agent</span>
                                            <span className="font-bold">{selectedApp.agent?.name || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs sm:text-sm">
                                            <span className="text-muted-foreground">Assigned Counselor</span>
                                            <span className="font-bold">{selectedApp.counselor?.name || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                                    <h5 className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle2 className="h-3 w-3" /> Current Status
                                    </h5>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-base sm:text-lg font-bold text-foreground">{selectedApp.status.replace(/_/g, " ")}</span>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground italic leading-tight">Your application is currently at the {selectedApp.status.replace(/_/g, " ").toLowerCase()} stage.</p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-8 opacity-50" />

                            {/* Notes/Comments Section */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-primary" /> Comments & Attachments
                                </h3>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                                    {selectedApp.applicationNotes.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground text-xs italic">
                                            No comments yet. Start the conversation below.
                                        </div>
                                    ) : (
                                        selectedApp.applicationNotes.map((note) => (
                                            <div key={note.id} className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between gap-4 px-2">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                                        {note.user?.name || "System"} • <span className="text-primary">{note.user?.role || "SYSTEM"}</span>
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {format(new Date(note.createdAt), "dd MMM, hh:mm a")}
                                                    </span>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-sm leading-relaxed">
                                                    {note.note}
                                                    {note.attachmentUrl && (
                                                        <div className="mt-3 pt-3 border-t border-border/50">
                                                            <a
                                                                href={note.attachmentUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-border text-[11px] font-bold text-primary hover:bg-primary/5 transition-all"
                                                            >
                                                                <Paperclip className="h-3 w-3" /> {note.attachmentName || "View Attachment"}
                                                                <ArrowUpRight className="h-2.5 w-2.5" />
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add New Note Form */}
                                <form onSubmit={handleAddNote} className="pt-6 border-t border-border/50 space-y-3">
                                    <div className="relative group">
                                        <Textarea
                                            placeholder="Write your message or query here..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            className="min-h-[100px] rounded-2xl border-border/60 bg-slate-50/50 focus:bg-white focus:ring-primary/20 transition-all resize-none text-sm p-4"
                                        />
                                        <div className="absolute right-3 bottom-3 flex items-center gap-2">
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting || !newNote.trim()}
                                                className="h-9 px-4 rounded-xl shadow-lg shadow-primary/20"
                                            >
                                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                                Send Message
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground text-center italic">
                                        Messages are sent to your assigned counselor and agent.
                                    </p>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case "PENDING": return "bg-amber-100 text-amber-600";
        case "SUBMITTED": return "bg-blue-100 text-blue-600";
        case "UNDER_REVIEW": return "bg-indigo-100 text-indigo-600";
        case "OFFER_RECEIVED": return "bg-emerald-100 text-emerald-600";
        case "READY_FOR_VISA": return "bg-orange-100 text-orange-600";
        case "ENROLLED": return "bg-cyan-100 text-cyan-600";
        case "REJECTED": return "bg-rose-100 text-rose-600";
        default: return "bg-slate-100 text-slate-600";
    }
}
