"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import axios from "axios";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { CreateLeadDialog } from "@/components/dashboard/CreateLeadDialog";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeadsPage() {
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchLeads = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);

            const response = await axios.get(`/api/leads?${params.toString()}`);
            setLeads(response.data);
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLeads();
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-8">

            {/* Search Bar */}
            <Card className="border-0 rounded-3xl bg-white">
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Search by name, email, or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 bg-gray-50 border-gray-200 rounded-2xl h-12 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-zinc-400"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">All Leads</h2>
                            <p className="text-sm text-muted-foreground">{leads.length} leads found in system</p>
                        </div>
                        <CreateLeadDialog onLeadCreated={fetchLeads} />
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-20 w-full rounded-xl" />
                            <Skeleton className="h-20 w-full rounded-xl" />
                        </div>
                    ) : (
                        <LeadsTable data={leads} onUpdate={fetchLeads} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
