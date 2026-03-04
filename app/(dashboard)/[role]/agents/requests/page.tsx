"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, XCircle, Clock, User, Mail, Phone, Building2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

interface AgentRequest {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    agentProfile: {
        id: string;
        phone: string | null;
        companyName: string | null;
        address: string | null;
        approvalStatus: ApprovalStatus;
    } | null;
}

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    PENDING: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: <Clock className="w-3.5 h-3.5" /> },
    APPROVED: { label: "Approved", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle className="w-3.5 h-3.5" /> },
    REJECTED: { label: "Rejected", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function AgentRequestsPage() {
    const { data: session } = useSession() as any;
    const [agents, setAgents] = useState<AgentRequest[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [filter, setFilter] = useState<ApprovalStatus>("PENDING");
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`/api/agents/requests?status=${filter}&search=${encodeURIComponent(search)}`);
            setAgents(res.data.agents || []);
            setCounts(res.data.counts || {});
        } catch {
            toast.error("Failed to load agent requests");
        } finally {
            setIsLoading(false);
        }
    }, [filter, search]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleAction = async (agentUserId: string, action: "APPROVED" | "REJECTED") => {
        setActionLoading(agentUserId + action);
        try {
            await axios.patch("/api/agents/requests", { agentUserId, action });
            toast.success(action === "APPROVED" ? "Agent approved successfully!" : "Agent registration rejected.");
            fetchRequests();
        } catch {
            toast.error("Action failed. Please try again.");
        } finally {
            setActionLoading(null);
        }
    };

    if (session?.user?.role !== "ADMIN") {
        return (
            <div className="p-10">
                <Card className="border-0 rounded-3xl">
                    <CardContent className="p-16 text-center">
                        <p className="text-gray-500">You don't have permission to view this page.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const filterTabs: { id: ApprovalStatus; label: string; count?: number }[] = [
        { id: "PENDING", label: "Pending", count: counts["PENDING"] },
        { id: "APPROVED", label: "Approved", count: counts["APPROVED"] },
        { id: "REJECTED", label: "Rejected", count: counts["REJECTED"] },
    ];

    return (
        <div className="flex flex-col gap-4 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 px-1">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Agent Requests</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Review and manage agent registration requests</p>
                </div>
            </div>

            <Card className="border-0 rounded-3xl overflow-hidden bg-card">
                <CardContent className="p-4">
                    {/* Search + Tab Filters */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-[13px] placeholder:text-muted-foreground/40 w-full"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {filterTabs.map((tab) => {
                                const cfg = STATUS_CONFIG[tab.id];
                                const isActive = filter === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setFilter(tab.id)}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border ${isActive ? `${cfg.bg} ${cfg.color} shadow-sm` : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"}`}
                                    >
                                        {cfg.icon}
                                        {tab.label}
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white/70" : "bg-muted"}`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Agent Cards */}
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
                        </div>
                    ) : agents.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                <User className="w-8 h-8 text-muted-foreground/40" />
                            </div>
                            <p className="text-sm font-semibold text-muted-foreground">No {filter.toLowerCase()} requests</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                                {filter === "PENDING" ? "New agent registrations will appear here." : `No agents have been ${filter.toLowerCase()} yet.`}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {agents.map((agent) => {
                                const status = (agent.agentProfile?.approvalStatus || "PENDING") as ApprovalStatus;
                                const cfg = STATUS_CONFIG[status];
                                const regDate = new Date(agent.createdAt).toLocaleDateString("en-IN", {
                                    day: "2-digit", month: "short", year: "numeric",
                                });

                                return (
                                    <div
                                        key={agent.id}
                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                                    >
                                        {/* Avatar + Info */}
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-blue-600 font-bold text-sm">
                                                    {agent.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-sm text-foreground">{agent.name}</span>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color}`}>
                                                        {cfg.icon} {cfg.label}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Mail className="w-3 h-3" /> {agent.email}
                                                    </span>
                                                    {agent.agentProfile?.phone && (
                                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Phone className="w-3 h-3" /> {agent.agentProfile.phone}
                                                        </span>
                                                    )}
                                                    {agent.agentProfile?.companyName && (
                                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Building2 className="w-3 h-3" /> {agent.agentProfile.companyName}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-muted-foreground/60 mt-1">Registered {regDate}</p>
                                            </div>
                                        </div>

                                        {/* Action Buttons - only show for PENDING */}
                                        {status === "PENDING" && (
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={!!actionLoading}
                                                    onClick={() => handleAction(agent.id, "REJECTED")}
                                                    className="h-8 px-3 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                                >
                                                    {actionLoading === agent.id + "REJECTED" ? (
                                                        <div className="w-3 h-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                                                    ) : (
                                                        <><XCircle className="w-3.5 h-3.5 mr-1" /> Reject</>
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    disabled={!!actionLoading}
                                                    onClick={() => handleAction(agent.id, "APPROVED")}
                                                    className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                >
                                                    {actionLoading === agent.id + "APPROVED" ? (
                                                        <div className="w-3 h-3 border-2 border-emerald-300 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <><CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve</>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
