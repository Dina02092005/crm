"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useLeads } from "@/hooks/use-leads";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { CreateLeadDialog } from "@/components/dashboard/CreateLeadDialog";
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
        <div className="flex flex-col gap-6 p-4 sm:p-8">

            {/* Search and Filter Bar */}
            <Card className="border-0 rounded-3xl bg-card">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 bg-muted/50 border-input rounded-2xl h-12 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full h-12 px-4 bg-muted/50 border border-input rounded-2xl focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                            >
                                <option value="ALL">All Status</option>
                                <option value="NEW">New</option>
                                <option value="ASSIGNED">Assigned</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="FOLLOW_UP">Follow Up</option>
                                <option value="CONVERTED">Converted</option>
                                <option value="LOST">Lost</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 rounded-3xl overflow-hidden bg-card">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">All Leads</h2>
                            <p className="text-sm text-muted-foreground">{totalLeads} leads found</p>
                        </div>
                        <CreateLeadDialog onLeadCreated={() => { }} />
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
