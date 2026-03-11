"use client";

import { useState } from "react";
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
    LayoutDashboard,
    PieChart as PieChartIcon,
    BarChart3,
    FileText,
    CheckCircle2
} from "lucide-react";
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
    const [activeTab, setActiveTab] = useState<ReportTab>('overview');
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
        <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden">
            {/* Left Sidebar: Navigation & Filters */}
            <div className="w-80 flex flex-col gap-4 shrink-0">
                {/* Navigation Card */}
                <Card className="border-border/60 shadow-sm rounded-3xl overflow-hidden shrink-0">
                    <CardHeader className="p-5 pb-2">
                        <CardTitle className="text-base font-black">Report Views</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                        <div className="flex flex-col gap-1">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as ReportTab)}
                                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left w-full
                                        ${activeTab === tab.id
                                            ? "bg-primary/10 text-primary shadow-sm"
                                            : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"}`}
                                >
                                    <div className={`p-2 rounded-xl border ${activeTab === tab.id ? "bg-primary text-white border-transparent" : "bg-muted/50 border-border/40"}`}>
                                        <tab.icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-bold">{tab.label}</span>
                                    {activeTab === tab.id && <ChevronRight className="h-4 w-4 ml-auto" />}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Filters Card */}
                <Card className="flex-1 overflow-hidden flex flex-col border-border/60 shadow-sm rounded-3xl">
                    <CardHeader className="p-5 pb-2 shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <CardTitle className="text-base font-black">Filters</CardTitle>
                            <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 px-2 text-[10px] font-bold uppercase rounded-lg text-primary hover:bg-primary/5">
                                Reset
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 flex-1 overflow-hidden">
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-4">
                                {/* Date Range */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Date Range</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            type="date"
                                            value={filters.from}
                                            onChange={e => setFilters({ ...filters, from: e.target.value })}
                                            className="h-8 rounded-lg text-[10px] px-2"
                                        />
                                        <Input
                                            type="date"
                                            value={filters.to}
                                            onChange={e => setFilters({ ...filters, to: e.target.value })}
                                            className="h-8 rounded-lg text-[10px] px-2"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {['today', 'week', 'month', 'year'].map(q => (
                                            <button
                                                key={q}
                                                onClick={() => setQuickFilter(q as any)}
                                                className="px-2 py-1 rounded-md bg-muted/50 text-[9px] font-bold uppercase hover:bg-primary/10 hover:text-primary transition-colors"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Selectors */}
                                {[
                                    { label: 'Source', key: 'source', options: filterOptions?.sources?.map((s: string) => ({ id: s, name: s })) },
                                    { label: 'Country', key: 'country', options: filterOptions?.countries },
                                    { label: 'Agent', key: 'agentId', options: filterOptions?.agents },
                                    { label: 'Counselor', key: 'counselorId', options: filterOptions?.counselors },
                                ].map(group => (
                                    <div key={group.key} className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{group.label}</label>
                                        <Select
                                            value={(filters as any)[group.key] || "all"}
                                            onValueChange={v => setFilters({ ...filters, [group.key]: v === "all" ? "" : v })}
                                        >
                                            <SelectTrigger className="h-9 rounded-xl border-border/60 bg-muted/20 text-xs text-left">
                                                <SelectValue placeholder={`All ${group.label}s`} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="all">All {group.label}s</SelectItem>
                                                {group.options?.map((opt: any) => (
                                                    <SelectItem key={opt.id} value={opt.id || opt.name}>{opt.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}

                                {/* Status & Temp */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Status</label>
                                        <Select value={filters.status || "all"} onValueChange={v => setFilters({ ...filters, status: v === "all" ? "" : v })}>
                                            <SelectTrigger className="h-8 rounded-lg border-border/60 bg-muted/20 text-[10px]">
                                                <SelectValue placeholder="All" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="all">All</SelectItem>
                                                <SelectItem value="NEW">New</SelectItem>
                                                <SelectItem value="CONTACTED">Contacted</SelectItem>
                                                <SelectItem value="CONVERTED">Converted</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Temp</label>
                                        <Select value={filters.temperature || "all"} onValueChange={v => setFilters({ ...filters, temperature: v === "all" ? "" : v })}>
                                            <SelectTrigger className="h-8 rounded-lg border-border/60 bg-muted/20 text-[10px]">
                                                <SelectValue placeholder="All" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="all">All</SelectItem>
                                                <SelectItem value="HOT">Hot</SelectItem>
                                                <SelectItem value="WARM">Warm</SelectItem>
                                                <SelectItem value="COLD">Cold</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={handleApplyFilters}
                                    className="w-full rounded-xl h-9 font-bold shadow-sm shadow-primary/20 mt-2"
                                >
                                    <Filter className="h-3.5 w-3.5 mr-2" /> Apply Filters
                                </Button>
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Right Panel: Content Area */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <Card className="flex-1 overflow-hidden flex flex-col border-border/60 shadow-sm rounded-3xl">
                    <CardHeader className="p-6 pb-4 border-b border-border/40 bg-white/50 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl border bg-primary/10 text-primary border-primary/20">
                                    {(() => { const Icon = TABS.find(t => t.id === activeTab)?.icon || LayoutDashboard; return <Icon className="h-5 w-5" />; })()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black">{TABS.find(t => t.id === activeTab)?.label}</h2>
                                    <p className="text-xs text-muted-foreground/70">
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
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                                    {[
                                        { label: "Leads", value: analytics?.summary?.totalLeads, icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
                                        { label: "Converted", value: analytics?.summary?.convertedLeads, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
                                        { label: "Assigned", value: analytics?.summary?.assignedLeads, icon: Users, color: "text-amber-600 bg-amber-50" },
                                        { label: "Conv. Rate", value: `${analytics?.summary?.conversionRate}%`, icon: Percent, color: "text-violet-600 bg-violet-50" },
                                        { label: "Cold/Old", value: analytics?.summary?.unassignedLeads, icon: UserMinus, color: "text-rose-600 bg-rose-50" },
                                    ].map((card, i) => (
                                        <div key={i} className="bg-muted/30 p-4 rounded-2xl border border-border/40 flex flex-col gap-2 transition-all hover:bg-muted/50">
                                            <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center`}>
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
                                    <div className="bg-white p-6 rounded-2xl border border-border/40 shadow-sm relative group overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <h3 className="text-sm font-black text-foreground mb-6">Leads Created Trend</h3>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={analytics?.charts?.leadsOverTime}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={d => format(new Date(d), "MMM d")} />
                                                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                                    <Tooltip contentStyle={{ borderRadius: 16, border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", fontWeight: "bold" }} />
                                                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 0 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'distribution' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-border/40 shadow-sm">
                                        <h3 className="text-sm font-black text-foreground mb-6">Leads by Source</h3>
                                        <div className="h-[280px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={analytics?.charts?.leadsBySource} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                                                        {analytics?.charts?.leadsBySource?.map((_: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: "bold", paddingTop: 20 }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-border/40 shadow-sm">
                                        <h3 className="text-sm font-black text-foreground mb-6">Leads by Country</h3>
                                        <div className="h-[280px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={analytics?.charts?.leadsByCountry} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                                                        {analytics?.charts?.leadsByCountry?.map((_: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: "bold", paddingTop: 20 }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'performance' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-2xl border border-border/40 overflow-hidden shadow-sm">
                                        <div className="p-4 border-b border-border/30 bg-muted/20">
                                            <h3 className="text-sm font-black">Agent Performance</h3>
                                        </div>
                                        <Table>
                                            <TableHeader className="bg-muted/10">
                                                <TableRow>
                                                    <TableHead className="text-[10px] uppercase font-black px-6">Name</TableHead>
                                                    <TableHead className="text-[10px] uppercase font-black">Assigned</TableHead>
                                                    <TableHead className="text-[10px] uppercase font-black">Converted</TableHead>
                                                    <TableHead className="text-[10px] uppercase font-black px-6">Success Rate</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {analytics?.performance?.agents?.length === 0 ? (
                                                    <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground text-xs italic">No agent data found</TableCell></TableRow>
                                                ) : (
                                                    analytics?.performance?.agents?.map((a: any) => (
                                                        <TableRow key={a.name} className="hover:bg-muted/5">
                                                            <TableCell className="px-6 font-bold text-xs">{a.name}</TableCell>
                                                            <TableCell className="text-xs">{a.assigned}</TableCell>
                                                            <TableCell className="text-xs">{a.converted}</TableCell>
                                                            <TableCell className="px-6">
                                                                <Badge variant="outline" className="text-primary bg-primary/5 rounded-lg border-primary/20 font-black">
                                                                    {a.assigned > 0 ? ((a.converted / a.assigned) * 100).toFixed(1) : 0}%
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-border/40 overflow-hidden shadow-sm">
                                        <div className="p-4 border-b border-border/30 bg-muted/20">
                                            <h3 className="text-sm font-black">Counselor Processing</h3>
                                        </div>
                                        <Table>
                                            <TableHeader className="bg-muted/10">
                                                <TableRow>
                                                    <TableHead className="text-[10px] uppercase font-black px-6">Name</TableHead>
                                                    <TableHead className="text-[10px] uppercase font-black">Students</TableHead>
                                                    <TableHead className="text-[10px] uppercase font-black">Applications</TableHead>
                                                    <TableHead className="text-[10px] uppercase font-black px-6 text-right">Visa Filed</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {analytics?.performance?.counselors?.length === 0 ? (
                                                    <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground text-xs italic">No counselor data found</TableCell></TableRow>
                                                ) : (
                                                    analytics?.performance?.counselors?.map((c: any) => (
                                                        <TableRow key={c.name} className="hover:bg-muted/5">
                                                            <TableCell className="px-6 font-bold text-xs">{c.name}</TableCell>
                                                            <TableCell className="text-xs">{c.students}</TableCell>
                                                            <TableCell className="text-xs">{c.applications}</TableCell>
                                                            <TableCell className="px-6 text-right text-xs font-black text-emerald-600">{c.visaFiled}</TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'export' && (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden flex flex-col">
                                        <div className="p-4 bg-muted/20 border-b border-border/30 flex justify-between items-center gap-4">
                                            <div className="relative w-full max-w-sm">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                                                <Input
                                                    placeholder="Search leads..."
                                                    className="pl-9 h-9 rounded-xl border-border/60 text-xs bg-white"
                                                    value={filters.search}
                                                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <Button variant="outline" size="sm" className="rounded-xl h-9 border-border/60 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" onClick={() => handleExport('xlsx')}>
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
