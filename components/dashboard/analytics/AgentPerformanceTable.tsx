"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Agent {
    agentId: string;
    name: string;
    leads: number;
    students: number;
    applications: number;
    enrollments: number;
    conversionRate: number;
}

interface AgentPerformanceTableProps {
    agents: Agent[];
    isLoading: boolean;
}

type SortKey = keyof Omit<Agent, "agentId" | "name">;

export function AgentPerformanceTable({ agents, isLoading }: AgentPerformanceTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>("leads");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("desc"); }
    };

    const sorted = [...(agents || [])].sort((a, b) => {
        const v = sortDir === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
        return v;
    });

    const cols: { key: SortKey; label: string }[] = [
        { key: "leads", label: "Leads" },
        { key: "students", label: "Students" },
        { key: "applications", label: "Apps" },
        { key: "enrollments", label: "Enrolled" },
        { key: "conversionRate", label: "Conv. %" },
    ];

    const SortIcon = ({ k }: { k: SortKey }) => {
        if (sortKey !== k) return <ChevronUp className="h-3 w-3 text-muted-foreground/30" />;
        return sortDir === "asc"
            ? <ChevronUp className="h-3 w-3 text-primary" />
            : <ChevronDown className="h-3 w-3 text-primary" />;
    };

    return (
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50">
                <p className="text-sm font-semibold text-foreground/80">Agent Performance</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/50 bg-muted/30">
                            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Agent</th>
                            {cols.map(c => (
                                <th key={c.key}
                                    className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none"
                                    onClick={() => toggleSort(c.key)}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        {c.label} <SortIcon k={c.key} />
                                    </div>
                                </th>
                            ))}
                            <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Rate Bar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-border/30">
                                    <td colSpan={7} className="px-4 py-3">
                                        <div className="h-4 bg-muted animate-pulse rounded" />
                                    </td>
                                </tr>
                            ))
                        ) : sorted.length === 0 ? (
                            <tr><td colSpan={7} className="text-center p-8 text-xs text-muted-foreground">No agent data available</td></tr>
                        ) : sorted.map((agent, i) => (
                            <tr key={agent.agentId}
                                className={`border-b border-border/30 transition-colors hover:bg-muted/30 ${i === 0 ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}`}
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                                            {agent.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-[13px] text-foreground">{agent.name}</span>
                                        {i === 0 && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">TOP</span>}
                                    </div>
                                </td>
                                {cols.map(c => (
                                    <td key={c.key} className="text-right px-4 py-3 tabular-nums text-[13px] font-medium">
                                        {c.key === "conversionRate" ? `${agent[c.key]}%` : agent[c.key].toLocaleString()}
                                    </td>
                                ))}
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full"
                                                style={{ width: `${Math.min(agent.conversionRate, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
