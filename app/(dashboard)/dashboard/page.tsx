"use client";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentLeadsTable } from "@/components/dashboard/RecentLeadsTable";
import { MapPin, Users, TrendingUp, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { LeadAnalyticsGraph } from "@/components/dashboard/LeadAnalyticsGraph";
import { LeadCustomerRatio } from "@/components/dashboard/LeadCustomerRatio";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { LeadStatusDistribution } from "@/components/dashboard/LeadStatusDistribution";

interface DashboardData {
    stats: {
        totalLeads: number;
        totalCustomers: number;
        totalEmployees: number;
        newLeadsToday: number;
    };
    recentLeads: any[];
    upcomingTasks: any[];
    leadStatusCounts: any[];
    analytics: any[];
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
        totalEmployees: 0,
        newLeadsToday: 0
    };

    const recentLeads = data?.recentLeads || [];

    return (
        <div className="space-y-6">
            {/* ROW 1: Stats */}
            <div>
                <h2 className="text-[18px] font-medium leading-none tracking-normal font-sans text-foreground mb-4">Dashboard Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Leads"
                        value={isLoading ? "..." : (stats.totalLeads ?? 0).toString()}
                        icon={<MapPin className="w-5 h-5" />}
                        iconBgColor="bg-blue-50 text-blue-600"
                    />
                    <StatsCard
                        title="Total Customers"
                        value={isLoading ? "..." : (stats.totalCustomers ?? 0).toString()}
                        icon={<Users className="w-5 h-5" />}
                        iconBgColor="bg-purple-50 text-purple-600"
                    />
                    <StatsCard
                        title="Total Employees"
                        value={isLoading ? "..." : (stats.totalEmployees ?? 0).toString()}
                        icon={<Briefcase className="w-5 h-5" />}
                        iconBgColor="bg-green-50 text-green-600"
                    />
                    <div className="h-full">
                        <LeadCustomerRatio
                            totalLeads={stats.totalLeads}
                            totalCustomers={stats.totalCustomers}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            </div>

            {/* ROW 2: Charts (Graph + Pipeline) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                <div className="lg:col-span-2 h-full">
                    <LeadAnalyticsGraph
                        data={data?.analytics || []}
                        isLoading={isLoading}
                    />
                </div>
                <div className="lg:col-span-1 h-full">
                    <LeadStatusDistribution
                        data={data?.leadStatusCounts || []}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            {/* ROW 3: Activities (Tasks + Recent Leads) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                <div className="h-full min-h-[400px]">
                    <UpcomingTasks
                        tasks={data?.upcomingTasks || []}
                        isLoading={isLoading}
                    />
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[18px] font-medium leading-none tracking-normal font-sans text-foreground">Latest Leads Activity</h2>
                        <Link href="/leads" className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity flex items-center gap-1">
                            View All <span className="text-lg leading-none">›</span>
                        </Link>
                    </div>
                    {isLoading ? (
                        <Skeleton className="h-[350px] w-full rounded-xl" />
                    ) : (
                        <div className="border border-border/50 rounded-xl overflow-hidden bg-card">
                            <RecentLeadsTable data={recentLeads} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
