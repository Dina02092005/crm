"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, Loader2, Globe, GraduationCap, Calendar, User, Search, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useApplications, useUpdateApplication } from "@/hooks/useApi";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useRolePath } from "@/hooks/use-role-path";
import { OfferLetterModal } from "@/components/applications/OfferLetterModal";
import { ApplicationCommentsModal } from "@/components/applications/ApplicationCommentsModal";
import { ApplicationNotesModal } from "@/components/applications/ApplicationNotesModal";
import { ApplicationHistoryModal } from "@/components/applications/ApplicationHistoryModal";
import { AddUniversityApplicationModal } from "@/components/student/AddUniversityApplicationModal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApplicationStatus } from "@/lib/enums";

interface UniversityApplicationsSectionProps {
    studentId: string;
    studentName: string;
}

export function UniversityApplicationsSection({ studentId, studentName }: UniversityApplicationsSectionProps) {
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    
    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [offerLetterApp, setOfferLetterApp] = useState<any>(null);
    const [commentsApp, setCommentsApp] = useState<any>(null);
    const [historyApp, setHistoryApp] = useState<any>(null);
    const [notesApp, setNotesApp] = useState<any>(null);

    // Filter by studentId and possibly status if using standard endpoint
    const { data, isLoading, refetch } = useApplications(page, limit, searchQuery, statusFilter === "ALL" ? null : statusFilter, studentId);
    
    // Quick status mutation hook
    const updateMutation = useUpdateApplication();
    const [updatingRecordId, setUpdatingRecordId] = useState<string | null>(null);

    // Collapsible state for each card
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        setExpandedCards(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleStatusChange = async (appId: string, newStatus: string) => {
        setUpdatingRecordId(appId);
        try {
            await updateMutation.mutateAsync({
                id: appId,
                data: { status: newStatus as ApplicationStatus }
            });
            refetch();
            toast.success("Status updated successfully");
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setUpdatingRecordId(null);
        }
    };

    function getStatusColor(status: string) {
        switch (status) {
            case "PENDING": return "bg-amber-100 text-amber-600";
            case "SUBMITTED": return "bg-blue-100 text-blue-600";
            case "APPLIED": return "bg-teal-100 text-teal-600";
            case "FINALIZED": return "bg-emerald-100 text-emerald-600";
            case "READY_FOR_VISA": return "bg-orange-100 text-orange-600";
            case "VISA_PROCESS": return "bg-indigo-100 text-indigo-600";
            case "DEFERRED": return "bg-pink-100 text-pink-600";
            case "ENROLLED": return "bg-cyan-100 text-cyan-600";
            case "REJECTED": return "bg-rose-100 text-rose-600";
            default: return "bg-slate-100 text-slate-600";
        }
    }

    const applications = data?.applications || [];

    return (
        <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden hover:border-primary/20 transition-all">
            <CardHeader className="pb-4 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between bg-white gap-4">
                <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" /> Applications
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">Manage university applications and track their statuses.</CardDescription>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-9 w-[130px] rounded-xl text-xs font-semibold">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="ALL">All Status</SelectItem>
                                {Object.values(ApplicationStatus).map(status => (
                                    <SelectItem key={status} value={status}>{status.replace(/_/g, " ")}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="relative w-full sm:w-48 text-muted-foreground">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4" />
                            <Input
                                placeholder="Search Uni..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 h-9 rounded-xl text-xs bg-slate-50 border-border/50"
                            />
                        </div>
                    </div>
                    <Button
                        size="sm"
                        className="rounded-xl h-9 font-bold px-4 w-full sm:w-auto shadow-sm"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Add Application
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 bg-slate-50/50">
                {isLoading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium italic animate-pulse">Loading assigned applications...</p>
                    </div>
                ) : applications.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-2">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Applications Found</p>
                        <p className="text-xs text-slate-400">Add an application to track university progress.</p>
                        <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)} className="mt-4 rounded-xl">
                            <Plus className="h-4 w-4 mr-2" /> Start Application
                        </Button>
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {applications.map((app: any) => (
                            <Card key={app.id} className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden transition-all hover:border-primary/30 hover:shadow-md">
                                <div 
                                    className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    onClick={() => toggleExpand(app.id)}
                                >
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className={`${getStatusColor(app.status)} border-none text-[10px] uppercase font-black px-2 py-0.5 tracking-wider`}>
                                                {app.status.replace(/_/g, ' ')}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Calendar className="h-3 w-3" /> {app.intake || 'No Intake'}
                                            </span>
                                        </div>
                                        <h4 className="text-[15px] font-bold text-foreground line-clamp-1">{app.courseName || app.course?.name || "Program Not Specified"}</h4>
                                        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5 font-medium">
                                            <GraduationCap className="h-3.5 w-3.5" /> <span className="text-primary font-bold">{app.universityName || app.university?.name || "No University"}</span>
                                            <span className="text-slate-300 mx-1">•</span>
                                            <Globe className="h-3.5 w-3.5 text-slate-400" /> {app.country?.name || "No Country"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right hidden md:block border-r border-slate-100 pr-4 mr-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Added On</p>
                                            <p className="text-xs font-semibold text-slate-700">{new Date(app.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                            {expandedCards[app.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                
                                {expandedCards[app.id] && (
                                    <div className="bg-slate-50/50 p-4 border-t border-slate-100">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Counselor</p>
                                                <p className="text-xs font-semibold flex items-center gap-1.5 text-slate-700">
                                                    <User className="h-3.5 w-3.5 text-slate-400" /> {app.counselor?.name || 'Unassigned'}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Agent</p>
                                                <p className="text-xs font-semibold flex items-center gap-1.5 text-slate-700">
                                                    <User className="h-3.5 w-3.5 text-slate-400" /> {app.agent?.name || 'Unassigned'}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Last Updated</p>
                                                <p className="text-xs font-semibold flex items-center gap-1.5 text-slate-700">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> {new Date(app.updatedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 pt-4 border-t border-slate-200 border-dashed">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setHistoryApp(app); }} className="h-8 rounded-xl text-xs font-bold border-slate-200 bg-white shadow-sm hover:bg-slate-50">
                                                    View History
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setNotesApp(app); }} className="h-8 rounded-xl text-xs font-bold border-slate-200 bg-white shadow-sm hover:bg-slate-50">
                                                    Notes ({app._count?.applicationNotes || 0})
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setCommentsApp(app); }} className="h-8 rounded-xl text-xs font-bold border-slate-200 bg-white shadow-sm hover:bg-slate-50">
                                                    Comments
                                                </Button>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                                                <Button size="sm" disabled={updatingRecordId === app.id} onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, 'FINALIZED'); }} className="h-8 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none shadow-none px-4">
                                                    Finalize
                                                </Button>
                                                <Button size="sm" disabled={updatingRecordId === app.id} onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, 'READY_FOR_VISA'); }} className="h-8 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none shadow-none px-4">
                                                    Visa
                                                </Button>
                                                <Button size="sm" disabled={updatingRecordId === app.id} onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, 'DEFERRED'); }} className="h-8 rounded-xl text-xs font-bold bg-pink-50 text-pink-600 hover:bg-pink-100 border-none shadow-none px-4">
                                                    Defer
                                                </Button>
                                                <Button size="sm" disabled={updatingRecordId === app.id} onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, 'ENROLLED'); }} className="h-8 rounded-xl text-xs font-bold bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border-none shadow-none px-4">
                                                    Enroll
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Modals */}
            <AddUniversityApplicationModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                studentId={studentId}
                studentName={studentName}
                studentEmail={""}
                studentPhone={""}
                onSuccess={() => {
                    setIsAddModalOpen(false);
                    refetch(); // Automatically refresh list and append state!
                }}
            />

            <ApplicationHistoryModal
                isOpen={!!historyApp}
                onClose={() => setHistoryApp(null)}
                applicationId={historyApp?.id}
                application={historyApp}
            />

            <ApplicationNotesModal
                isOpen={!!notesApp}
                onClose={() => setNotesApp(null)}
                applicationId={notesApp?.id}
                onUpdate={refetch}
            />

            <OfferLetterModal
                isOpen={!!offerLetterApp}
                onClose={() => setOfferLetterApp(null)}
                application={offerLetterApp}
                onUpdate={refetch}
            />

            <ApplicationCommentsModal
                isOpen={!!commentsApp}
                onClose={() => setCommentsApp(null)}
                application={commentsApp}
                onUpdate={refetch}
            />
        </Card>
    );
}
