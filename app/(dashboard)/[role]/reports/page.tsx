"use client";

import React, { useState, useEffect, Fragment } from "react";
import {
    Download,
    Filter,
    TrendingUp,
    Users,
    UserMinus,
    Percent,
    Search,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    ChevronDown,
    Building2,
    MapPin,
    Globe,
    LayoutDashboard,
    PieChart as PieChartIcon,
    BarChart3,
    FileText
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, Legend,
} from "recharts";
import { useReportFilters, useReportAnalytics, useReportLeads, ReportFilters } from "@/hooks/use-reports";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

type ReportTab = 'overview' | 'distribution' | 'performance' | 'export';

export default function ReportsPage() {
    const { data: session } = useSession() as any;
    const userRole = session?.user?.role;

    const [activeTab, setActiveTab] = useState<ReportTab>('overview');
    const [expandedAgents, setExpandedAgents] = useState<string[]>([]);
    const [filters, setFilters] = useState<ReportFilters>({
        page: 1,
        limit: 25,
        status: "",
        source: "",
        country: "",
        agentId: "",
        counselorId: "",
        temperature: "",
        from: format(subDays(new Date(), 30), "yyyy-MM-dd"),
        to: format(new Date(), "yyyy-MM-dd"),
    });

    const { data: filterOptions } = useReportFilters();
    const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useReportAnalytics(filters);
    const { data: leadsData, isLoading: leadsLoading, refetch: refetchLeads } = useReportLeads(filters);

    const handleApplyFilters = () => {
        setFilters(prev => ({ ...prev, page: 1 }));
        refetchAnalytics();
        refetchLeads();
    };

    const handleReset = () => {
        setFilters({
            page: 1,
            limit: 25,
            from: format(subDays(new Date(), 30), "yyyy-MM-dd"),
            to: format(new Date(), "yyyy-MM-dd"),
        });
    };

    const setQuickFilter = (type: 'today' | 'week' | 'month' | 'year') => {
        const to = format(new Date(), "yyyy-MM-dd");
        let from = to;
        if (type === 'week') from = format(startOfWeek(new Date()), "yyyy-MM-dd");
        if (type === 'month') from = format(startOfMonth(new Date()), "yyyy-MM-dd");
        if (type === 'year') from = format(startOfYear(new Date()), "yyyy-MM-dd");

        setFilters(prev => ({ ...prev, from, to }));
    };

    const handleExport = (formatType: 'xlsx' | 'csv') => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, String(value));
        });
        params.append('format', formatType);
        window.open(`/api/reports/export?${params.toString()}`, '_blank');
        toast.success(`Exporting ${formatType.toUpperCase()}...`);
    };

    const TABS = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'distribution', label: 'Distribution', icon: PieChartIcon },
        { id: 'performance', label: 'Performance', icon: BarChart3 },
        { id: 'export', label: 'Export Data', icon: FileText },
    ];

    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            {/* Header & Main Controls */}
            <div className="flex flex-col gap-3 shrink-0">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-primary/10 border border-primary/20">
                            <LayoutDashboard className="h-4 w-4 text-primary" />
                            <h1 className="text-xs font-black tracking-tight text-primary uppercase">Reports</h1>
                        </div>
                        
                        <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-2xl border border-border/40 backdrop-blur-xl shrink-0">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as ReportTab)}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-xl transition-all text-[11px] font-black uppercase
                                        ${activeTab === tab.id
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"}`}
                                >
                                    <tab.icon className="h-3.5 w-3.5" />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={handleReset} className="h-9 px-4 text-[10px] font-black uppercase rounded-xl border-border/60 hover:bg-primary/5 transition-all">
                            Reset Filters
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleApplyFilters}
                            className="h-9 px-6 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-primary/20 transition-all"
                        >
                            <Filter className="h-3.5 w-3.5 mr-2" /> Apply Filters
                        </Button>
                    </div>
                </div>

                {/* Expanded Filters Grid */}
                <Card className="border-border/60 shadow-xl rounded-2xl bg-card/10 backdrop-blur-xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                        {/* Time Period Column */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Quick Selection</label>
                            <div className="flex flex-wrap gap-1.5">
                                {['today', 'week', 'month', 'year'].map(q => (
                                    <button
                                        key={q}
                                        onClick={() => setQuickFilter(q as any)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border
                                            ${filters.from === format(q === 'today' ? new Date() : q === 'week' ? startOfWeek(new Date()) : q === 'month' ? startOfMonth(new Date()) : startOfYear(new Date()), "yyyy-MM-dd")
                                                ? "bg-primary text-white border-transparent shadow-md shadow-primary/20"
                                                : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60"}`}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date Range Group */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Date Range</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="date"
                                    value={filters.from}
                                    onChange={e => setFilters({ ...filters, from: e.target.value })}
                                    className="h-10 rounded-xl text-xs px-3 border-border/60 bg-muted/20 focus:bg-background transition-colors"
                                />
                                <Input
                                    type="date"
                                    value={filters.to}
                                    onChange={e => setFilters({ ...filters, to: e.target.value })}
                                    className="h-10 rounded-xl text-xs px-3 border-border/60 bg-muted/20 focus:bg-background transition-colors"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Lead Status</label>
                            <Select value={filters.status || "all"} onValueChange={v => setFilters({ ...filters, status: v === "all" ? "" : v })}>
                                <SelectTrigger className="h-10 rounded-xl border-border/60 bg-muted/20 text-xs px-3">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/60">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="NEW">New Lead</SelectItem>
                                    <SelectItem value="CONTACTED">Contacted</SelectItem>
                                    <SelectItem value="CONVERTED">Converted</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Source Filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Inquiry Source</label>
                            <Select value={filters.source || "all"} onValueChange={v => setFilters({ ...filters, source: v === "all" ? "" : v })}>
                                <SelectTrigger className="h-10 rounded-xl border-border/60 bg-muted/20 text-xs px-3">
                                    <SelectValue placeholder="All Sources" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/60">
                                    <SelectItem value="all">All Sources</SelectItem>
                                    {filterOptions?.sources?.map((s: string) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Country Filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Target Country</label>
                            <Select value={filters.country || "all"} onValueChange={v => setFilters({ ...filters, country: v === "all" ? "" : v })}>
                                <SelectTrigger className="h-10 rounded-xl border-border/60 bg-muted/20 text-xs px-3">
                                    <SelectValue placeholder="All Countries" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/60">
                                    <SelectItem value="all">All Countries</SelectItem>
                                    {filterOptions?.countries?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Temperature Filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Lead Temperature</label>
                            <Select value={filters.temperature || "all"} onValueChange={v => setFilters({ ...filters, temperature: v === "all" ? "" : v })}>
                                <SelectTrigger className="h-10 rounded-xl border-border/60 bg-muted/20 text-xs px-3 font-bold">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${filters.temperature === 'HOT' ? 'bg-rose-500' : filters.temperature === 'WARM' ? 'bg-amber-500' : filters.temperature === 'COLD' ? 'bg-blue-500' : 'bg-muted-foreground'}`} />
                                        <SelectValue placeholder="All Temperat..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/60">
                                    <SelectItem value="all">All Temperatures</SelectItem>
                                    <SelectItem value="HOT" className="text-rose-500 font-bold text-xs">🔥 Hot</SelectItem>
                                    <SelectItem value="WARM" className="text-amber-500 font-bold text-xs">☀️ Warm</SelectItem>
                                    <SelectItem value="COLD" className="text-blue-500 font-bold text-xs">❄️ Cold</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Hierarchical Filters */}
                        {['ADMIN', 'SUPER_ADMIN'].includes(userRole) && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Assigned Agent</label>
                                <Select value={filters.agentId || "all"} onValueChange={v => setFilters({ ...filters, agentId: v === "all" ? "" : v })}>
                                    <SelectTrigger className="h-10 rounded-xl border-border/60 bg-muted/20 text-xs px-3">
                                        <SelectValue placeholder="All Agents" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/60">
                                        <SelectItem value="all">All Agents</SelectItem>
                                        {filterOptions?.agents?.map((a: any) => (
                                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {['ADMIN', 'SUPER_ADMIN', 'AGENT'].includes(userRole) && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Specific Counselor</label>
                                <Select value={filters.counselorId || "all"} onValueChange={v => setFilters({ ...filters, counselorId: v === "all" ? "" : v })}>
                                    <SelectTrigger className="h-10 rounded-xl border-border/60 bg-muted/20 text-xs px-3">
                                        <SelectValue placeholder="All Counselors" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/60">
                                        <SelectItem value="all">All Counselors</SelectItem>
                                        {filterOptions?.counselors?.map((c: any) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
                <Card className="flex-1 overflow-hidden flex flex-col border-border/60 shadow-md rounded-[2rem] bg-card/30 backdrop-blur-xl">
                    <CardHeader className="p-4 border-b border-border/40 bg-muted/20 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl border bg-primary/10 text-primary border-primary/20">
                                    {(() => { const Icon = TABS.find(t => t.id === activeTab)?.icon || LayoutDashboard; return <Icon className="h-4 w-4" />; })()}
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-base font-black">{TABS.find(t => t.id === activeTab)?.label}</h2>
                                    <p className="text-[10px] text-muted-foreground/70 hidden md:block">
                                        {activeTab === 'overview' && "Key performance indicators and lead Acquisition trends."}
                                        {activeTab === 'distribution' && "Geographic and source distribution of your lead database."}
                                        {activeTab === 'performance' && "Comparative productivity tables for your team members."}
                                        {activeTab === 'export' && "Refine lead data and download in CSV or Excel format."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Report Content */}
                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            {/* Summary Cards */}
                            {activeTab !== 'export' && (
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                                    {[
                                        { label: "Leads", value: analytics?.summary?.totalLeads, icon: TrendingUp, color: "text-blue-500 bg-blue-500/10" },
                                        { label: "Converted", value: analytics?.summary?.convertedLeads, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10" },
                                        { label: "Assigned", value: analytics?.summary?.assignedLeads, icon: Users, color: "text-amber-500 bg-amber-500/10" },
                                        { label: "Conv. Rate", value: `${analytics?.summary?.conversionRate}%`, icon: Percent, color: "text-violet-500 bg-violet-500/10" },
                                        { label: "Cold/Old", value: analytics?.summary?.unassignedLeads, icon: UserMinus, color: "text-rose-500 bg-rose-500/10" },
                                    ].map((card, i) => (
                                        <div key={i} className="bg-muted/30 p-3 rounded-xl border border-border/40 flex items-center gap-3 transition-all hover:bg-muted/50">
                                            <div className={`w-8 h-8 shrink-0 rounded-lg ${card.color} flex items-center justify-center`}>
                                                <card.icon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{card.label}</p>
                                                <h3 className="text-lg font-black text-foreground leading-none">
                                                    {analyticsLoading ? "..." : card.value}
                                                </h3>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="bg-card/40 p-6 rounded-2xl border border-border/40 shadow-sm relative group overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <h3 className="text-sm font-black text-foreground mb-6">Leads Created Trend</h3>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={analytics?.charts?.leadsOverTime}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={d => format(new Date(d), "MMM d")} />
                                                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: 16, border: "1px solid hsl(var(--border))", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", fontWeight: "bold" }} />
                                                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 2, fill: "#3b82f6", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 0 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'distribution' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-card/40 p-6 rounded-2xl border border-border/40 shadow-sm">
                                        <h3 className="text-sm font-black text-foreground mb-6">Leads by Source</h3>
                                        <div className="h-[280px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={analytics?.charts?.leadsBySource} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                                                        {analytics?.charts?.leadsBySource?.map((_: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                                                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: "bold", paddingTop: 20, color: "hsl(var(--foreground))" }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="bg-card/40 p-6 rounded-2xl border border-border/40 shadow-sm">
                                        <h3 className="text-sm font-black text-foreground mb-6">Leads by Country</h3>
                                        <div className="h-[280px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={analytics?.charts?.leadsByCountry} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                                                        {analytics?.charts?.leadsByCountry?.map((_: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                                                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: "bold", paddingTop: 20, color: "hsl(var(--foreground))" }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'performance' && (
                                <div className="space-y-6">
                                    <div className="bg-card/40 rounded-2xl border border-border/40 overflow-hidden shadow-sm">
                                        <div className="p-4 border-b border-border/30 bg-muted/20 flex items-center justify-between">
                                            <h3 className="text-sm font-black">
                                                {userRole === 'COUNSELOR' ? 'My Performance' : 
                                                 userRole === 'AGENT' ? 'My Team Performance' : 
                                                 'Network Hierarchy'}
                                            </h3>
                                            <Badge variant="outline" className="text-[10px] uppercase font-black px-2 rounded-lg">
                                                {userRole} VIEW
                                            </Badge>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className="bg-muted/10">
                                                    <TableRow className="border-b-0">
                                                        <TableHead className="text-[10px] uppercase font-black px-6 w-[300px]">Entity</TableHead>
                                                        <TableHead className="text-[10px] uppercase font-black px-4">Leads</TableHead>
                                                        <TableHead className="text-[10px] uppercase font-black px-4">Conversion</TableHead>
                                                        <TableHead className="text-[10px] uppercase font-black px-4">Onboarded</TableHead>
                                                        <TableHead className="text-[10px] uppercase font-black px-4">Applications</TableHead>
                                                        <TableHead className="text-[10px] uppercase font-black px-6 text-right">Visa Filed</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {analytics?.performance?.hierarchy?.length === 0 && !analytics?.performance?.counselors?.length ? (
                                                        <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic text-xs">No performance data found for the selected filters</TableCell></TableRow>
                                                    ) : (
                                                        <>
                                                            {/* Hierarchical View for Admins/Agents */}
                                                            {analytics?.performance?.hierarchy?.map((agent: any) => {
                                                                const isExpanded = expandedAgents.includes(agent.id);
                                                                return (
                                                                    <Fragment key={agent.id}>
                                                                        <TableRow 
                                                                            className={`group transition-colors cursor-pointer ${isExpanded ? 'bg-primary/[0.03]' : 'hover:bg-muted/10'}`}
                                                                            onClick={() => setExpandedAgents(prev => 
                                                                                isExpanded ? prev.filter(id => id !== agent.id) : [...prev, agent.id]
                                                                            )}
                                                                        >
                                                                            <TableCell className="px-6 py-4">
                                                                                <div className="flex items-center gap-3">
                                                                                    {agent.counselors?.length > 0 ? (
                                                                                        isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                                                                    ) : <div className="w-4" />}
                                                                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                                                                        <Building2 className="h-4 w-4" />
                                                                                    </div>
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-sm font-black">{agent.name}</span>
                                                                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Team Lead / Agent</span>
                                                                                    </div>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="px-4 font-bold text-sm">{agent.assigned}</TableCell>
                                                                            <TableCell className="px-4">
                                                                                <Badge variant="outline" className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                                                                    {agent.assigned > 0 ? ((agent.converted / agent.assigned) * 100).toFixed(1) : 0}%
                                                                                </Badge>
                                                                            </TableCell>
                                                                            <TableCell className="px-4 text-sm font-bold text-muted-foreground">
                                                                                {agent.counselors?.reduce((acc: number, c: any) => acc + c.students, 0) || '-'}
                                                                            </TableCell>
                                                                            <TableCell className="px-4 text-sm font-bold text-muted-foreground">
                                                                                {agent.counselors?.reduce((acc: number, c: any) => acc + c.applications, 0) || '-'}
                                                                            </TableCell>
                                                                            <TableCell className="px-6 text-right text-sm font-bold text-muted-foreground">
                                                                                {agent.counselors?.reduce((acc: number, c: any) => acc + c.visaFiled, 0) || '-'}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                        {isExpanded && agent.counselors.map((c: any) => (
                                                                            <TableRow key={c.id} className="bg-muted/5 border-l-2 border-primary/20 hover:bg-muted/10">
                                                                                <TableCell className="pl-14 pr-6 py-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                                                                                            <Users className="h-3 w-3" />
                                                                                        </div>
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-xs font-bold">{c.name}</span>
                                                                                            <span className="text-[9px] text-muted-foreground uppercase font-black">Counselor</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="px-4 text-xs font-medium">{c.assigned}</TableCell>
                                                                                <TableCell className="px-4">
                                                                                    <span className="text-xs font-black text-emerald-500">
                                                                                        {c.assigned > 0 ? ((c.converted / c.assigned) * 100).toFixed(1) : 0}%
                                                                                    </span>
                                                                                </TableCell>
                                                                                <TableCell className="px-4 text-xs font-black text-foreground">{c.students}</TableCell>
                                                                                <TableCell className="px-4 text-xs font-black text-foreground">{c.applications}</TableCell>
                                                                                <TableCell className="px-6 text-right text-xs font-black text-emerald-500">{c.visaFiled}</TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </Fragment>
                                                                );
                                                            })}

                                                            {/* Direct Counselor View (for Counselor Role or others if data exists) */}
                                                            {userRole === 'COUNSELOR' && analytics?.performance?.counselors?.map((c: any) => (
                                                                <TableRow key={c.name} className="hover:bg-primary/[0.02]">
                                                                    <TableCell className="px-6 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                                                <Users className="h-4 w-4" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-sm font-black">{c.name}</span>
                                                                                <span className="text-[10px] text-muted-foreground uppercase font-black">Self Performance</span>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="px-4 font-bold text-sm text-muted-foreground">-</TableCell>
                                                                    <TableCell className="px-4 font-bold text-sm text-muted-foreground">-</TableCell>
                                                                    <TableCell className="px-4 font-black">{c.students}</TableCell>
                                                                    <TableCell className="px-4 font-black">{c.applications}</TableCell>
                                                                    <TableCell className="px-6 text-right font-black text-emerald-500">{c.visaFiled}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'export' && (
                                <div className="space-y-4">
                                    <div className="bg-card/40 rounded-2xl border border-border/40 shadow-sm overflow-hidden flex flex-col">
                                        <div className="p-4 bg-muted/20 border-b border-border/30 flex justify-between items-center gap-4">
                                            <div className="relative w-full max-w-sm">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                                                <Input
                                                    placeholder="Search leads..."
                                                    className="pl-9 h-9 rounded-xl border-border/60 text-xs bg-muted/20"
                                                    value={filters.search}
                                                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <Button variant="outline" size="sm" className="rounded-xl h-9 border-border/60 hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors" onClick={() => handleExport('xlsx')}>
                                                    <Download className="h-4 w-4 mr-2" /> Excel
                                                </Button>
                                                <Button variant="outline" size="sm" className="rounded-xl h-9 border-border/60" onClick={() => handleExport('csv')}>
                                                    <Download className="h-4 w-4 mr-2" /> CSV
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className="bg-muted/5">
                                                    <TableRow>
                                                        <TableHead className="text-[10px] uppercase font-black px-6">Lead</TableHead>
                                                        <TableHead className="text-[10px] uppercase font-black">Source/Country</TableHead>
                                                        <TableHead className="text-[10px] uppercase font-black">Team</TableHead>
                                                        <TableHead className="text-[10px] uppercase font-black text-center">Status</TableHead>
                                                        <TableHead className="text-[10px] uppercase font-black px-6 text-right">Created</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {leadsLoading ? (
                                                        <TableRow><TableCell colSpan={5} className="h-40 text-center text-muted-foreground animate-pulse font-bold">Fetching records...</TableCell></TableRow>
                                                    ) : leadsData?.leads?.length === 0 ? (
                                                        <TableRow><TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic text-xs">No records found matching filters</TableCell></TableRow>
                                                    ) : (
                                                        leadsData?.leads?.map((l: any) => (
                                                            <TableRow key={l.id} className="hover:bg-muted/5 border-b border-border/20 last:border-0">
                                                                <TableCell className="px-6">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-black">{l.name}</span>
                                                                        <span className="text-[10px] text-muted-foreground">{l.phone || l.email}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-bold">{l.source || 'Direct'}</span>
                                                                        <span className="text-[10px] text-muted-foreground uppercase font-black">{l.country || '-'}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <div className="flex items-center gap-1.5"><Badge variant="outline" className="text-[8px] h-3 px-1 leading-none rounded-sm">A</Badge><span className="text-[10px] font-bold">{l.agent || 'Unassigned'}</span></div>
                                                                        <div className="flex items-center gap-1.5"><Badge variant="outline" className="text-[8px] h-3 px-1 leading-none rounded-sm">C</Badge><span className="text-[10px] font-bold">{l.counselor || 'None'}</span></div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Badge className={`text-[9px] font-black uppercase rounded-lg px-2 shadow-none border-transparent
                                                                        ${l.status === 'CONVERTED' ? 'bg-emerald-500 hover:bg-emerald-500' :
                                                                            l.status === 'NEW' ? 'bg-blue-500 hover:bg-blue-500' :
                                                                                'bg-slate-400 hover:bg-slate-400'}`}>
                                                                        {l.status}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="px-6 text-right text-[10px] font-black text-muted-foreground">
                                                                    {format(new Date(l.createdAt), "MMM d, yyyy")}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Pagination Footer */}
                                        {leadsData?.pagination?.totalPages > 1 && (
                                            <div className="p-4 border-t border-border/30 bg-muted/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                <span>Page {leadsData.pagination.page} of {leadsData.pagination.totalPages}</span>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" disabled={filters.page === 1} onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}><ChevronLeft className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" disabled={filters.page === leadsData.pagination.totalPages} onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}><ChevronRight className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
}
