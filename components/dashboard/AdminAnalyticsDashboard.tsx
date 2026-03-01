"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { KpiCards } from "./analytics/KpiCards";
import { LeadsCharts } from "./analytics/LeadsCharts";
import { ApplicationsCharts } from "./analytics/ApplicationsCharts";
import { VisaCharts } from "./analytics/VisaCharts";
import { FunnelChart } from "./analytics/FunnelChart";
import { AgentPerformanceTable } from "./analytics/AgentPerformanceTable";
import { Button } from "@/components/ui/button";
import { BarChart2, RefreshCw } from "lucide-react";

// ── Date range helpers ────────────────────────────────────────────────────────
type RangeId = "today" | "7d" | "30d" | "90d";

function buildRange(id: RangeId): { from: string; to: string } {
    const to = new Date();
    const from = new Date();
    if (id === "today") {
        from.setHours(0, 0, 0, 0);
    } else if (id === "7d") {
        from.setDate(from.getDate() - 7);
    } else if (id === "30d") {
        from.setDate(from.getDate() - 30);
    } else {
        from.setDate(from.getDate() - 90);
    }
    return {
        from: from.toISOString().split("T")[0],
        to: to.toISOString().split("T")[0],
    };
}

const RANGES: { id: RangeId; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" },
    { id: "90d", label: "90 Days" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 mt-2">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">{children}</span>
            <div className="h-px flex-1 bg-border/60" />
        </div>
    );
}

export function AdminAnalyticsDashboard() {
    const [rangeId, setRangeId] = useState<RangeId>("30d");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [useCustom, setUseCustom] = useState(false);

    const range = useCustom && customFrom && customTo
        ? { from: customFrom, to: customTo }
        : buildRange(rangeId);

    const params = new URLSearchParams({ from: range.from, to: range.to });

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ["admin-analytics", range.from, range.to],
        queryFn: async () => {
            const { data } = await axios.get(`/api/analytics?${params.toString()}`);
            return data;
        },
        staleTime: 2 * 60 * 1000, // 2 min cache
    });

    const handleRangeClick = useCallback((id: RangeId) => {
        setUseCustom(false);
        setRangeId(id);
    }, []);

    const kpis = data?.kpis ?? {};
    const loading = isLoading;

    return (
        <div className="space-y-5 pb-8">
            {/* ── Header bar ──────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow">
                        <BarChart2 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-[15px] font-bold text-foreground">Analytics Dashboard</h1>
                        <p className="text-[11px] text-muted-foreground">Admin-only · All data read-only</p>
                    </div>
                </div>

                {/* Range controls */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center rounded-xl border border-border/60 bg-muted/30 p-0.5 gap-0.5">
                        {RANGES.map(r => (
                            <button
                                key={r.id}
                                onClick={() => handleRangeClick(r.id)}
                                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${!useCustom && rangeId === r.id
                                        ? "bg-white dark:bg-card shadow text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                        {/* Custom range */}
                        <div className="flex items-center gap-1 pl-1">
                            <input
                                type="date"
                                value={customFrom}
                                onChange={e => { setCustomFrom(e.target.value); setUseCustom(true); }}
                                className="h-6 text-[11px] bg-transparent border-0 outline-none text-muted-foreground cursor-pointer w-32"
                            />
                            <span className="text-[10px] text-muted-foreground">–</span>
                            <input
                                type="date"
                                value={customTo}
                                onChange={e => { setCustomTo(e.target.value); setUseCustom(true); }}
                                className="h-6 text-[11px] bg-transparent border-0 outline-none text-muted-foreground cursor-pointer w-32"
                            />
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        className="h-8 rounded-xl px-3 gap-1.5 text-xs"
                        disabled={isFetching}
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* ── Date range badge ─────────────────────────────────────────── */}
            <p className="text-[11px] text-muted-foreground -mt-2">
                Showing data from <span className="font-semibold text-foreground">{range.from}</span> to <span className="font-semibold text-foreground">{range.to}</span>
            </p>

            {/* ── KPI Cards ────────────────────────────────────────────────── */}
            <KpiCards kpis={kpis} isLoading={loading} />

            {/* ── Leads Section ─────────────────────────────────────────────── */}
            <SectionTitle>Leads Analytics</SectionTitle>
            <LeadsCharts
                leadsOverTime={data?.leadsOverTime ?? []}
                leadsBySource={data?.leadsBySource ?? []}
                leadsByTemperature={data?.leadsByTemperature ?? []}
                isLoading={loading}
            />

            {/* ── Students Funnel + Applications ─────────────────────────── */}
            <SectionTitle>Students & Applications</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                    <FunnelChart funnel={data?.funnel ?? []} isLoading={loading} />
                </div>
                <div className="lg:col-span-3">
                    <ApplicationsCharts
                        applicationsByStatus={data?.applicationsByStatus ?? []}
                        applicationsByCountry={data?.applicationsByCountry ?? []}
                        applicationsByIntake={data?.applicationsByIntake ?? []}
                        isLoading={loading}
                    />
                </div>
            </div>

            {/* ── Visa ─────────────────────────────────────────────────────── */}
            <SectionTitle>Visa Analytics</SectionTitle>
            <VisaCharts
                visaByCountry={data?.visaByCountry ?? []}
                visaByStatus={data?.visaByStatus ?? []}
                isLoading={loading}
            />

            {/* ── Agent Performance ─────────────────────────────────────────── */}
            <SectionTitle>Agent Performance</SectionTitle>
            <AgentPerformanceTable agents={data?.agentPerformance ?? []} isLoading={loading} />
        </div>
    );
}
