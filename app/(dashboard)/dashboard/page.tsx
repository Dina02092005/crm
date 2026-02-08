"use client";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentLeadsTable } from "@/components/dashboard/RecentLeadsTable";
import { MapPin, Users, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface DashboardData {
    stats: {
        totalLeads: number;
        totalCustomers: number;
        newLeadsToday: number;
    };
    recentLeads: any[];
}

export default function DashboardPage() {
    const { data, isLoading } = useQuery<DashboardData>({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            const { data } = await axios.get("/api/dashboard");
            return data;
        },
    });

    const stats = data?.stats || {
        totalLeads: 0,
        totalCustomers: 0,
        newLeadsToday: 0
    };

    const recentLeads = data?.recentLeads || [];

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* LEFT COLUMN - Stats & Recent Leads List */}
            <div className="w-full lg:w-[340px] xl:w-[400px] 2xl:w-[460px] shrink-0 space-y-6 lg:space-y-8">
                {/* Stats Grid */}
                <div>
                    <h2 className="text-[18px] font-medium leading-none tracking-normal font-sans text-foreground mb-4">Dashboard Overview</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <StatsCard
                            title="Total Leads"
                            value={isLoading ? "..." : stats.totalLeads.toString()}
                            icon={<MapPin className="w-5 h-5" />}
                            iconBgColor="bg-blue-50 text-blue-600"
                        />
                        <StatsCard
                            title="Total Customers"
                            value={isLoading ? "..." : stats.totalCustomers.toString()}
                            icon={<Users className="w-5 h-5" />}
                            iconBgColor="bg-purple-50 text-purple-600"
                        />
                        <StatsCard
                            title="New Leads Today"
                            value={isLoading ? "..." : stats.newLeadsToday.toString()}
                            icon={<TrendingUp className="w-5 h-5" />}
                            iconBgColor="bg-orange-50 text-orange-600"
                        />
                    </div>
                </div>

                {/* Recent Leads List (Mobile/Side view) */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[18px] font-medium leading-none tracking-normal font-sans text-foreground">Recent Leads</h2>
                        <Link href="/leads" className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity flex items-center gap-1">
                            View All <span className="text-lg leading-none">›</span>
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-16 w-full rounded-xl" />
                            <Skeleton className="h-16 w-full rounded-xl" />
                            <Skeleton className="h-16 w-full rounded-xl" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentLeads.slice(0, 5).map((lead: any, i: number) => (
                                <Link key={i} href={`/leads/${lead.id}`}>
                                    <div className="flex items-center gap-3 p-3 bg-card rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-border/50">
                                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg shrink-0 flex items-center justify-center font-bold">
                                            {lead.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-foreground truncate">{lead.name}</h4>
                                            <p className="text-xs text-muted-foreground">{lead.phone}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`
                                                text-[10px] font-medium px-2 py-0.5 rounded-full
                                                ${lead.status === 'NEW' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}
                                            `}>
                                                {lead.status}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {recentLeads.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No leads found.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN - Table */}
            <div className="flex-1 min-w-0 space-y-8">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[18px] font-medium leading-none tracking-normal font-sans text-foreground">Latest Leads Activity</h2>
                        <Link href="/leads" className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity flex items-center gap-1">
                            View All <span className="text-lg leading-none">›</span>
                        </Link>
                    </div>
                    {isLoading ? (
                        <Skeleton className="h-48 w-full rounded-xl" />
                    ) : (
                        <RecentLeadsTable data={recentLeads} />
                    )}
                </div>
            </div>
        </div>
    );
}
