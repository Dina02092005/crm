"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useLeads, useLeadStats } from "@/hooks/use-leads";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRolePath } from "@/hooks/use-role-path";
import { useSession } from "next-auth/react";
import { BulkUploadLeadsButton } from "@/components/dashboard/BulkUploadLeadsButton";
import { useCountries, useCounselors } from "@/hooks/use-masters";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FilterX } from "lucide-react";

export default function LeadsPage() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [assignedTo, setAssignedTo] = useState("ALL");
    const [interestedCountry, setInterestedCountry] = useState("ALL");
    const [highestQualification, setHighestQualification] = useState("ALL");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const { data: session } = useSession() as any;
    const role = session?.user?.role;
    const { prefixPath } = useRolePath();

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useLeads({
        page,
        limit,
        search: debouncedSearch,
        status,
        assignedTo: assignedTo === "ALL" ? "" : assignedTo,
        interestedCountry: interestedCountry === "ALL" ? "" : interestedCountry,
        highestQualification: highestQualification === "ALL" ? "" : highestQualification,
    });

    const { data: countries } = useCountries();
    const { data: counselors } = useCounselors();

    const leads = data?.leads || [];
    const totalPages = data?.pagination.totalPages || 0;
    const totalLeads = data?.pagination.total || 0;

    // Reset page when search or status changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status, assignedTo, interestedCountry, highestQualification]);


    const { data: leadStats } = useLeadStats();

    // Map stats to filter IDs
    const getCount = (id: string) => {
        if (!leadStats) return 0;
        return leadStats[id as keyof typeof leadStats] || 0;
    };

    return (
        <div className="flex flex-col gap-3 p-3 sm:p-4">

            <Card className="border-0 rounded-3xl overflow-hidden bg-card">
                <CardContent className="p-4">
                    {/* Integrated Search and Action Row */}
                    <div className="flex flex-row items-center justify-between gap-2">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                            <Input
                                placeholder="Search by name, email, or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-[13px] placeholder:text-muted-foreground/40 font-sans w-full"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            {role === "ADMIN" && <BulkUploadLeadsButton onSuccess={refetch} />}
                            <Link href={prefixPath("/leads/new")}>
                                <Button className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl h-9 px-4 text-[13px] font-bold shadow-sm flex items-center gap-2">
                                    <Plus className="h-4 w-4" /> Add Lead
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    <div className="flex flex-wrap items-center gap-3 mt-4 mb-2">
                        <div className="w-full sm:w-[180px]">
                            <Select value={assignedTo} onValueChange={setAssignedTo}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 border-0 focus:ring-0">
                                    <SelectValue placeholder="Assigned To" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Counselors</SelectItem>
                                    {counselors?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full sm:w-[180px]">
                            <Select value={interestedCountry} onValueChange={setInterestedCountry}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 border-0 focus:ring-0">
                                    <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Countries</SelectItem>
                                    {countries?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full sm:w-[180px]">
                            <Select value={highestQualification} onValueChange={setHighestQualification}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 border-0 focus:ring-0">
                                    <SelectValue placeholder="Qualification" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Qualifications</SelectItem>
                                    {["10th", "12th", "Bachelor", "Master", "PhD"].map((q) => (
                                        <SelectItem key={q} value={q}>{q}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {(assignedTo !== "ALL" || interestedCountry !== "ALL" || highestQualification !== "ALL") && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setAssignedTo("ALL");
                                    setInterestedCountry("ALL");
                                    setHighestQualification("ALL");
                                }}
                                className="h-8 text-[11px] text-muted-foreground hover:text-destructive gap-1"
                            >
                                <FilterX className="h-3 w-3" /> Clear Filters
                            </Button>
                        )}
                    </div>

                    {/* Filter Pills - Integrated below search */}
                    <div className="flex flex-wrap gap-2 mt-3 mb-4">
                        {[
                            { id: "ALL", label: "All", color: "text-primary", bg: "bg-primary/10", border: "" },
                            { id: "NEW", label: "New", color: "text-primary", bg: "bg-primary/10", border: "" },
                            { id: "ASSIGNED", label: "Assigned", color: "text-blue-500", bg: "bg-blue-500/10", border: "" },
                            { id: "IN_PROGRESS", label: "In Progress", color: "text-indigo-500", bg: "bg-indigo-500/10", border: "" },
                            { id: "FOLLOW_UP", label: "Follow Up", color: "text-orange-500", bg: "bg-orange-500/10", border: "" },
                            { id: "CONVERTED", label: "Converted", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "" },
                            { id: "LOST", label: "Lost", color: "text-gray-500", bg: "bg-gray-500/10", border: "" },
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setStatus(f.id)}
                                className={`
                                    px-3 py-1 rounded-lg flex items-center gap-2 transition-all
                                    ${status === f.id
                                        ? `${f.bg} shadow-sm ring-1 ring-inset ${f.color.replace('text-', 'ring-')}/30`
                                        : "bg-muted/50 hover:bg-muted text-muted-foreground"
                                    }
                                `}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${status === f.id ? f.color : "text-muted-foreground"}`}>
                                        {f.label}
                                    </span>
                                    <span className={`text-[10px] font-bold ${status === f.id ? f.color : "text-muted-foreground/70"}`}>
                                        ({getCount(f.id)})
                                    </span>
                                </div>
                            </button>
                        ))}
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
                            onUpdate={refetch}
                            pagination={{
                                page,
                                totalPages,
                                pageSize: limit,
                                onPageChange: setPage,
                                onPageSizeChange: (newLimit) => {
                                    setLimit(newLimit);
                                    setPage(1);
                                }
                            }}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
