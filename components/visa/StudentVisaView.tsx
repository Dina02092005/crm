"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    PlaneLanding,
    Globe,
    Clock,
    User,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Stamp,
    Building2,
    BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export interface StudentVisaApplication {
    id: string;
    status: string;
    country: { name: string };
    university: { name: string };
    course: { name: string };
    assignedOfficer?: { name: string };
    createdAt: string;
    updatedAt: string;
}

export function StudentVisaView() {
    const [visaApps, setVisaApps] = useState<StudentVisaApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchVisa = async () => {
            try {
                const res = await axios.get("/api/student/visa");
                setVisaApps(res.data);
            } catch (error) {
                toast.error("Failed to fetch visa applications");
            } finally {
                setIsLoading(false);
            }
        };
        fetchVisa();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (visaApps.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground p-8 bg-card border border-dashed rounded-3xl">
                <PlaneLanding className="h-12 w-12 opacity-10 mb-4" />
                <h3 className="text-lg font-bold text-foreground">No Visa Records</h3>
                <p className="text-sm">Your visa processing will appear here once submitted.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">Visa Tracking</h2>
                <p className="text-xs text-muted-foreground">Monitor your visa application status and timeline.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {visaApps.map((visa) => (
                    <Card key={visa.id} className="border border-border rounded-3xl bg-card shadow-sm overflow-hidden group hover:border-primary/40 transition-all">
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
                            <CardContent className="p-6 md:p-8 space-y-8 border-r border-border/50">
                                {/* Header */}
                                <div className="flex flex-wrap justify-between items-start gap-4">
                                    <div className="space-y-2">
                                        <Badge className={`${getVisaStatusColor(visa.status)} border-none text-[10px] font-bold px-3 py-1 uppercase tracking-widest`}>
                                            {visa.status.replace(/_/g, " ")}
                                        </Badge>
                                        <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                                            <Globe className="h-6 w-6 text-primary" /> {visa.country.name} Visa Application
                                        </h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reference ID</p>
                                        <p className="text-sm font-mono font-bold text-primary">{visa.id.split('-')[0].toUpperCase()}</p>
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-5">
                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                                <Building2 className="h-4 w-4 text-slate-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">University</p>
                                                <p className="text-sm font-semibold">{visa.university.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                                <BookOpen className="h-4 w-4 text-slate-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Course</p>
                                                <p className="text-sm font-semibold">{visa.course.name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                                <User className="h-4 w-4 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Assigned Visa Officer</p>
                                                <p className="text-sm font-semibold">{visa.assignedOfficer?.name || "Processing..."}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                                <Calendar className="h-4 w-4 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Last Sync Update</p>
                                                <p className="text-sm font-semibold">{format(new Date(visa.updatedAt), "PPP")}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>

                            {/* Status Sidebar */}
                            <div className="p-6 md:p-8 bg-slate-50/50 flex flex-col justify-between items-center text-center">
                                <div className="space-y-4">
                                    <div className={`h-20 w-20 mx-auto rounded-full flex items-center justify-center border-4 ${getStatusBorder(visa.status)}`}>
                                        {visa.status === "VISA_APPROVED" ? (
                                            <Stamp className="h-10 w-10 text-emerald-600" />
                                        ) : visa.status === "VISA_REJECTED" || visa.status === "VISA_REFUSED" ? (
                                            <AlertCircle className="h-10 w-10 text-rose-600" />
                                        ) : (
                                            <Clock className="h-10 w-10 text-amber-600 animate-pulse" />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-muted-foreground uppercase">Next Milestone</p>
                                        <p className="text-sm font-bold text-foreground">
                                            {getNextMilestone(visa.status)}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-6 w-full">
                                    <p className="text-[9px] text-muted-foreground leading-relaxed italic">
                                        *If you have queries regarding your visa process, please contact your assigned Visa Officer directly via the Applications chat.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function getVisaStatusColor(status: string) {
    switch (status) {
        case "PENDING": return "bg-amber-100 text-amber-600";
        case "FILE_SUBMITTED": return "bg-blue-100 text-blue-600";
        case "PROCESS": return "bg-indigo-100 text-indigo-600";
        case "VISA_APPROVED": return "bg-emerald-100 text-emerald-600";
        case "VISA_REJECTED":
        case "VISA_REFUSED": return "bg-rose-100 text-rose-600";
        default: return "bg-slate-100 text-slate-600";
    }
}

function getStatusBorder(status: string) {
    switch (status) {
        case "VISA_APPROVED": return "border-emerald-500 bg-emerald-50";
        case "VISA_REJECTED":
        case "VISA_REFUSED": return "border-rose-500 bg-rose-50";
        default: return "border-amber-500 bg-amber-50";
    }
}

function getNextMilestone(status: string) {
    switch (status) {
        case "PENDING": return "Document Verification";
        case "FILE_SUBMITTED": return "Embassy Appointment";
        case "PROCESS": return "Embassy Decision";
        case "VISA_APPROVED": return "Travel Preparations";
        default: return "Processing Update";
    }
}
