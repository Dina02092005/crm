"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    Download,
    Filter,
    TrendingUp,
    Users,
    Percent,
    LayoutDashboard,
    PieChart as PieChartIcon,
    BarChart3,
    FileText,
    Activity,
    GraduationCap,
    Globe,
    Zap,
    Search,
    RefreshCw,
    ShieldCheck,
    Briefcase,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { 
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from "recharts";
import { 
    useReportFilters, 
    useReportAnalytics, 
    useReportLeads, 
    useReportStudents,
    useReportApplications,
    useReportVisa,
    useReportPerformance,
    useReportActivities,
    ReportFilters 
} from "@/hooks/use-reports";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ReportsTable } from "./ReportsTable";
import { 
    LEAD_COLUMNS, 
    STUDENT_COLUMNS, 
    APPLICATION_COLUMNS, 
    VISA_COLUMNS, 
    PERFORMANCE_COLUMNS, 
    ACTIVITY_COLUMNS 
} from "./columns";
import ExcelJS from "exceljs";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

type ReportTab = 'overview' | 'leads' | 'students' | 'applications' | 'visa' | 'performance' | 'activity';

export default function ReportsPage() {
    const { data: session } = useSession() as any;
    const userRole = session?.user?.role;

    const [activeTab, setActiveTab] = useState<ReportTab>('overview');
    const [filters, setFilters] = useState<ReportFilters>({
        page: 1,
        limit: 25,
        status: "",
        source: "",
        country: "",
        agentId: "",
        counselorId: "",
        from: format(subDays(new Date(), 30), "yyyy-MM-dd"),
        to: format(new Date(), "yyyy-MM-dd"),
        search: ""
    });

    const { data: filterOptions } = useReportFilters();
    const { 
        data: analytics, 
        isLoading: analyticsLoading, 
        refetch: refetchAnalytics 
    } = useReportAnalytics(filters);
    
    // Data hooks for each tab
    const leadsQuery = useReportLeads(filters);
    const studentsQuery = useReportStudents(filters);
    const applicationsQuery = useReportApplications(filters);
    const visaQuery = useReportVisa(filters);
    const performanceQuery = useReportPerformance(filters);
    const activitiesQuery = useReportActivities(filters);

    const activeQuery = useMemo(() => {
        switch(activeTab) {
            case 'leads': return leadsQuery;
            case 'students': return studentsQuery;
            case 'applications': return applicationsQuery;
            case 'visa': return visaQuery;
            case 'performance': return performanceQuery;
            case 'activity': return activitiesQuery;
            default: return { data: null, isLoading: false, refetch: () => {} };
        }
    }, [activeTab, leadsQuery, studentsQuery, applicationsQuery, visaQuery, performanceQuery, activitiesQuery]);

    const handleReset = () => {
        setFilters({
            page: 1,
            limit: 25,
            status: "",
            source: "",
            country: "",
            agentId: "",
            counselorId: "",
            from: format(subDays(new Date(), 30), "yyyy-MM-dd"),
            to: format(new Date(), "yyyy-MM-dd"),
            search: ""
        });
    };

    const handleExport = async (type: 'xlsx' | 'csv') => {
        const dataToExport = activeQuery.data?.[activeTab]?.length ? activeQuery.data[activeTab] : null;
        if (!dataToExport) {
            toast.error("No data available to export");
            return;
        }

        toast.info(`Preparing ${type.toUpperCase()} export...`);

        if (type === 'csv') {
            const headers = Object.keys(dataToExport[0]).join(',');
            const rows = dataToExport.map((row: any) => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
            const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `report_${activeTab}_${format(new Date(), 'yyyyMMdd')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet(activeTab.toUpperCase());
            
            const columns = Object.keys(dataToExport[0]).map(key => ({ header: key.toUpperCase(), key }));
            sheet.columns = columns;
            sheet.addRows(dataToExport);

            // Styling
            sheet.getRow(1).font = { bold: true };
            sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `report_${activeTab}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
            anchor.click();
            window.URL.revokeObjectURL(url);
        }
        toast.success("Report downloaded successfully");
    };

    const TABS = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'leads', label: 'Leads', icon: TrendingUp },
        { id: 'students', label: 'Students', icon: GraduationCap },
        { id: 'applications', label: 'Apps', icon: FileText },
        { id: 'visa', label: 'Visa', icon: Globe },
        { id: 'performance', label: 'KPIs', icon: BarChart3 },
        { id: 'activity', label: 'Activity', icon: Activity },
    ];

    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-3 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            <h1 className="text-xs font-black tracking-tight text-primary uppercase">Reports & Insights</h1>
                        </div>
                        
                        <ScrollArea className="w-full max-w-[600px]">
                            <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/40 backdrop-blur-xl shrink-0">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as ReportTab)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[10px] font-black uppercase whitespace-nowrap
                                            ${activeTab === tab.id
                                                ? "bg-white text-primary shadow-sm border border-border/40"
                                                : "hover:bg-muted/40 text-muted-foreground"}`}
                                    >
                                        <tab.icon className="h-3.5 w-3.5" />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="h-1" />
                        </ScrollArea>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex gap-1 mr-2 border-r pr-2 border-border/40">
                             <Button variant="ghost" size="icon" onClick={() => { refetchAnalytics(); activeQuery.refetch(); }} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                                <RefreshCw className={cn("h-3.5 w-3.5", (analyticsLoading || activeQuery.isLoading) && "animate-spin")} />
                             </Button>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleReset} 
                            className="h-8 px-3 rounded-lg text-[10px] font-black uppercase border-border/60"
                        >
                            Reset
                        </Button>
                        <Select value={filters.limit?.toString()} onValueChange={v => setFilters({ ...filters, limit: parseInt(v) })}>
                            <SelectTrigger className="h-8 w-24 rounded-lg text-[10px] font-black uppercase border-border/60">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="25">25 / Page</SelectItem>
                                <SelectItem value="50">50 / Page</SelectItem>
                                <SelectItem value="100">100 / Page</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="h-8 w-[1px] bg-border/40 mx-1" />
                        <Button
                            size="sm"
                            disabled={activeTab === 'overview'}
                            onClick={() => handleExport('xlsx')}
                            className="h-8 px-4 rounded-lg text-[10px] font-black uppercase gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
                        >
                            <Download className="h-3.5 w-3.5" /> Export XLSX
                        </Button>
                    </div>
                </div>

                {/* Filter Bar */}
                <Card className="border-border/60 shadow-lg rounded-2xl bg-card/20 backdrop-blur-md p-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[200px] flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                <Input 
                                    placeholder="Global search..." 
                                    value={filters.search}
                                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                                    className="h-9 pl-9 rounded-xl border-border/40 bg-muted/10 text-xs focus:bg-background transition-all" 
                                />
                            </div>
                            <Button 
                                size="sm" 
                                onClick={() => activeQuery.refetch()}
                                className="h-9 rounded-xl px-4 text-[10px] font-black uppercase bg-primary shadow-lg shadow-primary/20"
                            >
                                <Search className="h-3.5 w-3.5 mr-2" /> Search
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 bg-muted/10 p-1 rounded-xl border border-border/40">
                             <Input 
                                type="date" 
                                value={filters.from}
                                onChange={e => setFilters({ ...filters, from: e.target.value })}
                                className="h-7 w-32 border-0 bg-transparent text-[10px] font-bold p-0 px-2" 
                             />
                             <div className="text-[10px] font-black text-muted-foreground opacity-30">TO</div>
                             <Input 
                                type="date" 
                                value={filters.to}
                                onChange={e => setFilters({ ...filters, to: e.target.value })}
                                className="h-7 w-32 border-0 bg-transparent text-[10px] font-bold p-0 px-2" 
                             />
                        </div>

                        <Select value={filters.status || "all"} onValueChange={v => setFilters({ ...filters, status: v === "all" ? "" : v })}>
                            <SelectTrigger className="h-9 min-w-[140px] rounded-xl border-border/40 text-xs bg-muted/10">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">Every Status</SelectItem>
                                {activeTab === 'leads' && filterOptions?.leadStatuses?.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                {activeTab === 'students' && filterOptions?.studentStatuses?.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                {activeTab === 'applications' && filterOptions?.applicationStatuses?.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                {activeTab === 'visa' && filterOptions?.visaStatuses?.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={filters.country || "all"} onValueChange={v => setFilters({ ...filters, country: v === "all" ? "" : v })}>
                            <SelectTrigger className="h-9 min-w-[140px] rounded-xl border-border/40 text-xs bg-muted/10">
                                <SelectValue placeholder="Any Country" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">Any Country</SelectItem>
                                {filterOptions?.countries?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        {['ADMIN', 'SUPER_ADMIN'].includes(userRole) && (
                            <Select value={filters.agentId || "all"} onValueChange={v => setFilters({ ...filters, agentId: v === "all" ? "" : v })}>
                                <SelectTrigger className="h-9 min-w-[140px] rounded-xl border-border/40 text-xs bg-muted/10 font-bold">
                                    <SelectValue placeholder="All Agents" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">All Data Assets</SelectItem>
                                    {filterOptions?.agents?.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}

                        {['ADMIN', 'SUPER_ADMIN', 'AGENT'].includes(userRole) && (
                             <Select value={filters.counselorId || "all"} onValueChange={v => setFilters({ ...filters, counselorId: v === "all" ? "" : v })}>
                                <SelectTrigger className="h-9 min-w-[140px] rounded-xl border-border/40 text-xs bg-muted/10">
                                    <SelectValue placeholder="All Counselors" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">Unified View</SelectItem>
                                    {filterOptions?.counselors?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                             </Select>
                        )}
                    </div>
                </Card>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <ScrollArea className="h-full">
                    <div className="p-1 space-y-4">
                        {activeTab === 'overview' ? (
                            <div className="space-y-6">
                                {/* Metric Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: "Total Leads", value: analytics?.summary?.totalLeads, icon: TrendingUp, color: "text-blue-500 bg-blue-500/10", trend: "Acquisition" },
                                        { label: "Conversion", value: analytics?.summary?.conversionRate + "%", icon: Zap, color: "text-amber-500 bg-amber-500/10", trend: "Efficiency" },
                                        { label: "Active Apps", value: analytics?.summary?.totalApps, icon: FileText, color: "text-violet-500 bg-violet-500/10", trend: "Pipeline" },
                                        { label: "Visa Filed", value: analytics?.summary?.visaApprovals, icon: ShieldCheck, color: "text-emerald-500 bg-emerald-500/10", trend: "Success" },
                                    ].map((m, i) => (
                                        <Card key={i} className="border-border/40 shadow-sm overflow-hidden bg-white/50 group hover:shadow-md transition-all">
                                            <div className="p-4 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{m.label}</p>
                                                    <h3 className="text-2xl font-black text-slate-900 leading-none">
                                                        {analyticsLoading ? "..." : m.value}
                                                    </h3>
                                                </div>
                                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", m.color)}>
                                                    <m.icon className="h-6 w-6" />
                                                </div>
                                            </div>
                                            <div className="px-4 py-2 bg-muted/10 border-t border-border/20 flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">{m.trend} Tracking Active</span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {/* Charts Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card className="border-border/40 shadow-sm rounded-[2rem] overflow-hidden">
                                        <CardHeader className="bg-muted/10 border-b border-border/20 p-4">
                                            <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                                                <LineChart className="h-4 w-4 text-primary" /> Lead Inflow Trend
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 h-[280px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={analytics?.charts?.leadsOverTime}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                                                    <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: "bold" }} axisLine={false} tickLine={false} tickFormatter={d => format(new Date(d), "MMM d")} />
                                                    <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #eee', fontSize: '12px' }} />
                                                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border/40 shadow-sm rounded-[2rem] overflow-hidden">
                                        <CardHeader className="bg-muted/10 border-b border-border/20 p-4">
                                            <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                                                <BarChart3 className="h-4 w-4 text-primary" /> Application Distribution
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 h-[280px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={analytics?.charts?.appsByStatus}>
                                                    <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: '12px' }} />
                                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#8b5cf6">
                                                        {analytics?.charts?.appsByStatus?.map((_: any, i: number) => (
                                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[calc(100vh-280px)] min-h-[500px]">
                                <ReportsTable 
                                    reportKey={activeTab}
                                    columns={
                                        activeTab === 'leads' ? LEAD_COLUMNS :
                                        activeTab === 'students' ? STUDENT_COLUMNS :
                                        activeTab === 'applications' ? APPLICATION_COLUMNS :
                                        activeTab === 'visa' ? VISA_COLUMNS :
                                        activeTab === 'performance' ? PERFORMANCE_COLUMNS :
                                        ACTIVITY_COLUMNS
                                    }
                                    data={activeQuery.data?.[activeTab] || []}
                                    isLoading={activeQuery.isLoading}
                                />
                            </div>
                        )}
                    </div>
                </ScrollArea>
                
                {/* Pagination Footer (Only for Table Tabs) */}
                {activeTab !== 'overview' && activeTab !== 'performance' && activeQuery.data?.pagination?.totalPages > 1 && (
                    <div className="shrink-0 p-3 bg-muted/20 border-t border-border/40 flex items-center justify-between">
                         <div className="text-[10px] font-black text-muted-foreground uppercase px-4">
                             Page {activeQuery.data.pagination.page} of {activeQuery.data.pagination.totalPages}
                         </div>
                         <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 rounded-lg text-[10px] font-black uppercase"
                                disabled={filters.page === 1}
                                onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
                            >
                                Previous
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 rounded-lg text-[10px] font-black uppercase"
                                disabled={filters.page === activeQuery.data.pagination.totalPages}
                                onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
                            >
                                Next
                            </Button>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
}
