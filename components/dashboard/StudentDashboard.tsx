"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    User,
    FileText,
    GraduationCap,
    CheckCircle2,
    Clock,
    ArrowRight,
    Search,
    Loader2,
    Calendar,
    MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useRolePath } from "@/hooks/use-role-path";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
    totalApplications: number;
    currentStatus: string;
    visaStatus: string;
    pendingDocsCount: number;
}

interface Activity {
    id: string;
    type: string;
    content: string;
    createdAt: string;
    user: string;
    role: string;
}

export function StudentDashboard() {
    const { prefixPath } = useRolePath();
    const [data, setData] = useState<{ stats: DashboardStats; recentActivity: Activity[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await axios.get("/api/student/dashboard");
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch student dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">Preparing your dashboard...</p>
            </div>
        );
    }

    const { stats, recentActivity } = data || {
        stats: { totalApplications: 0, currentStatus: "NEW", visaStatus: "NOT_STARTED", pendingDocsCount: 0 },
        recentActivity: []
    };

    return (
        <div className="space-y-6 px-1 py-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border border-border/60 rounded-2xl bg-card shadow-sm">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-blue-500" /> Total Applications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl sm:text-2xl font-bold">{stats.totalApplications}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border/60 rounded-2xl bg-card shadow-sm">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> App Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[9px] sm:text-[10px] px-1.5 py-0">
                            {stats.currentStatus}
                        </Badge>
                    </CardContent>
                </Card>

                <Card className="border border-border/60 rounded-2xl bg-card shadow-sm">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <GraduationCap className="h-3 w-3 text-indigo-500" /> Visa Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <Badge className="bg-indigo-500/10 text-indigo-600 border-none font-bold text-[9px] sm:text-[10px] px-1.5 py-0">
                            {stats.visaStatus}
                        </Badge>
                    </CardContent>
                </Card>

                <Card className="border border-border/60 rounded-2xl bg-card shadow-sm">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <FileText className="h-3 w-3 text-rose-500" /> Pending Docs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <div className="flex items-baseline gap-1.5">
                            <span className={`text-xl sm:text-2xl font-bold ${stats.pendingDocsCount > 0 ? "text-rose-500" : ""}`}>{stats.pendingDocsCount}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">Shortcuts</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <Link href={prefixPath("/profile")} className="group">
                            <div className="p-4 rounded-xl border border-border/60 bg-card hover:bg-primary/5 hover:border-primary/20 transition-all flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-semibold">Update Profile</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                        </Link>

                        <Link href={prefixPath("/documents")} className="group">
                            <div className="p-4 rounded-xl border border-border/60 bg-card hover:bg-teal-500/5 hover:border-teal-500/20 transition-all flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-semibold">My Documents</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </Link>

                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">Recent Updates</h3>
                    <Card className="border border-border/60 rounded-2xl bg-card shadow-none overflow-hidden h-[320px] lg:h-full">
                        <CardContent className="p-0">
                            {recentActivity.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground px-4 text-center">
                                    <MessageSquare className="h-10 w-10 opacity-10 mb-2" />
                                    <p className="text-xs">No recent updates or notes from your counselors.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {recentActivity.map((activity) => (
                                        <div key={activity.id} className="p-4 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-border">
                                                    <User className="h-4 w-4 text-slate-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <span className="text-xs font-bold text-foreground capitalize">{activity.user}</span>
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-2.5 w-2.5" />
                                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">"{activity.content}"</p>
                                                    <div className="mt-2 text-[9px] font-bold text-primary uppercase tracking-tight">
                                                        {activity.role}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
