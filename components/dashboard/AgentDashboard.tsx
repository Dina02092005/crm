"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
    LayoutDashboard,
    Calendar,
    Globe,
    BookOpen,
    Users,
    Activity,
    Bell,
    CheckCircle2,
    Clock,
    FileText,
    Plane,
    TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRolePath } from "@/hooks/use-role-path";
import { KpiCards } from "./analytics/KpiCards";
import { LeadsCharts } from "./analytics/LeadsCharts";
import { ApplicationsCharts } from "./analytics/ApplicationsCharts";
import { VisaCharts } from "./analytics/VisaCharts";
import { FunnelChart } from "./analytics/FunnelChart";
import { AgentPerformanceTable } from "./analytics/AgentPerformanceTable";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";

const OWNER_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

export function AgentDashboard() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { prefixPath } = useRolePath();

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get("/api/analytics/agent");
            setData(response.data);
        } catch (error) {
            console.error("Failed to fetch agent analytics", error);
            toast.error("Could not load dashboard data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Agent Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Real-time overview of your performance and counselor team
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={fetchAnalytics}>
                        <Activity className="h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <KpiCards kpis={data?.kpis} isLoading={isLoading} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left (2/3): Charts & Performance */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Lead Insights */}
                    <LeadsCharts
                        leadsOverTime={data?.leadsOverTime || []}
                        leadsBySource={data?.leadsBySource || []}
                        leadsByTemperature={data?.leadsByTemperature || []}
                        isLoading={isLoading}
                    />

                    {/* Leads by Owner */}
                    <Card className="rounded-2xl bg-card border border-border shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-foreground/80">Leads by Owner (Agent vs Team)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-[200px] w-full" />
                            ) : data?.leadsByOwner?.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={data.leadsByOwner}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="owner" tick={{ fontSize: 11 }} interval={0} />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                                        <Bar dataKey="leads" radius={[6, 6, 0, 0]}>
                                            {data.leadsByOwner.map((_: any, i: number) => (
                                                <Cell key={i} fill={OWNER_COLORS[i % OWNER_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No owner data available</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Counselor Performance */}
                    <AgentPerformanceTable
                        agents={data?.counselorPerformance || []}
                        isLoading={isLoading}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Student Lifecycle Funnel */}
                        <Card className="rounded-2xl bg-card border border-border shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-foreground/80">Student Lifecycle Funnel</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <FunnelChart funnel={data?.funnel || []} isLoading={isLoading} />
                            </CardContent>
                        </Card>

                        {/* Application Status */}
                        <div className="space-y-6">
                            <ApplicationsCharts
                                applicationsByStatus={data?.applicationsByStatus || []}
                                applicationsByCountry={data?.applicationsByCountry || []}
                                applicationsByIntake={data?.applicationsByIntake || []}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>

                    <VisaCharts
                        visaByStatus={data?.visaByStatus || []}
                        visaByCountry={data?.visaByCountry || []}
                        isLoading={isLoading}
                    />
                </div>

                {/* Right (1/3): Widgets & Priorities */}
                <div className="space-y-6">
                    {/* Follow-ups Due Today */}
                    <Card className="rounded-2xl bg-card border border-border shadow-none flex flex-col h-full lg:min-h-[400px]">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <CardTitle className="text-sm font-semibold text-foreground/80">Follow-ups Due Today</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            ) : data?.widgets?.followUps?.length > 0 ? (
                                <div className="space-y-3">
                                    {data.widgets.followUps.map((f: any) => (
                                        <div key={f.id} className="p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                                            <p className="text-sm font-bold text-foreground">{f.lead.name}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-[11px] text-muted-foreground">{f.lead.phone}</p>
                                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                                                    {new Date(f.nextFollowUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground h-full">
                                    <CheckCircle2 className="h-10 w-10 mb-2 opacity-20" />
                                    <p className="text-xs">All caught up for today!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pending Applications */}
                    <Card className="rounded-2xl bg-card border border-border shadow-none">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <Clock className="h-4 w-4 text-amber-600" />
                            <CardTitle className="text-sm font-semibold text-foreground/80">Pending Submission</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                                </div>
                            ) : data?.widgets?.pendingApps?.length > 0 ? (
                                <div className="space-y-2">
                                    {data.widgets.pendingApps.map((a: any) => (
                                        <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-950/30">
                                            <p className="text-xs font-medium truncate">{a.student.name}</p>
                                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-orange-600">VIEW</Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground py-4 text-center">No pending applications</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Documents Needed */}
                    <Card className="rounded-2xl bg-card border border-border shadow-none">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <FileText className="h-4 w-4 text-teal-600" />
                            <CardTitle className="text-sm font-semibold text-foreground/80">Visa Docs Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                                </div>
                            ) : data?.widgets?.pendingVisaDocs?.length > 0 ? (
                                <div className="space-y-2">
                                    {data.widgets.pendingVisaDocs.map((v: any) => (
                                        <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg bg-teal-50/50 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-950/30">
                                            <p className="text-xs font-medium truncate">{v.student.name}</p>
                                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-teal-600">ACTION</Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground py-4 text-center">No pending documents</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Notifications */}
                    <Card className="rounded-2xl bg-card border border-border shadow-none">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <Bell className="h-4 w-4 text-blue-600" />
                            <CardTitle className="text-sm font-semibold text-foreground/80">Notifications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                                </div>
                            ) : data?.widgets?.notifications?.length > 0 ? (
                                <div className="space-y-3">
                                    {data.widgets.notifications.map((n: any) => (
                                        <div key={n.id} className="flex flex-col gap-0.5 border-l-2 border-blue-500 pl-3">
                                            <p className="text-[11px] font-bold text-foreground">{n.title}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{n.message}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground py-4 text-center">No new notifications</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
