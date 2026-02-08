"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useLeads } from "@/hooks/use-leads";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { CreateLeadSheet } from "@/components/dashboard/CreateLeadSheet";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeadsPage() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [page, setPage] = useState(1);
    const limit = 10;

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading } = useLeads({
        page,
        limit,
        search: debouncedSearch,
        status,
    });

    const leads = data?.leads || [];
    const totalPages = data?.pagination.totalPages || 0;
    const totalLeads = data?.pagination.total || 0;

    // Reset page when search or status changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status]);

    return (
        <div className="flex flex-col gap-4 p-4 sm:p-6">

            {/* Search and Action Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Card className="flex-1 border border-border rounded-xl bg-card shadow-sm w-full">
                    <CardContent className="p-0 px-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                            <Input
                                placeholder="Search by name, email, or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-[13px] placeholder:text-muted-foreground/40 font-sans w-full"
                            />
                        </div>
                    </CardContent>
                </Card>
                <CreateLeadSheet onLeadCreated={() => { }} />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
                {[
                    { id: "ALL", label: "Total", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
                    { id: "NEW", label: "New", color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
                    { id: "ASSIGNED", label: "Assigned", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                    { id: "IN_PROGRESS", label: "In Progress", color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                    { id: "FOLLOW_UP", label: "Follow Up", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
                    { id: "CONVERTED", label: "Converted", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                    { id: "LOST", label: "Lost", color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20" },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setStatus(f.id)}
                        className={`
                            px-4 py-1.5 rounded-xl border flex items-center gap-3 transition-all
                            ${status === f.id
                                ? `${f.bg} ${f.border} shadow-sm ring-1 ring-inset ${f.color.replace('text-', 'ring-')}/30`
                                : "bg-card border-border hover:bg-muted/50"
                            }
                        `}
                    >
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${status === f.id ? f.color : "text-muted-foreground"}`}>
                            {f.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status === f.id ? f.color + " bg-white/50 dark:bg-black/20" : "bg-muted text-muted-foreground"}`}>
                            {f.id === "ALL" ? totalLeads : "10"}
                        </span>
                    </button>
                ))}
            </div>

            <Card className="border-0 rounded-3xl overflow-hidden bg-card">
                <CardContent className="p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-foreground">All Leads</h2>
                        <p className="text-sm text-muted-foreground">{totalLeads} leads found</p>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-20 w-full rounded-xl" />
                            <Skeleton className="h-20 w-full rounded-xl" />
                        </div>
                    ) : (
                        <LeadsTable
                            data={leads}
                            onUpdate={() => { }}
                            pagination={{
                                page,
                                totalPages,
                                onPageChange: setPage
                            }}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
