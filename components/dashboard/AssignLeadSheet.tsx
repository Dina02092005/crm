"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRolePath } from "@/hooks/use-role-path";

interface AssignLeadSheetProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string | null;
    leadName: string | null;
    onAssign: () => void;
}

export function AssignLeadSheet({
    isOpen,
    onClose,
    leadId,
    leadName,
    onAssign,
}: AssignLeadSheetProps) {
    const { data: session } = useSession() as any;
    const { prefixPath } = useRolePath();
    const [agents, setAgents] = useState<any[]>([]);
    const [agentCounselors, setAgentCounselors] = useState<Record<string, any[]>>({});
    const [isLoadingAgents, setIsLoadingAgents] = useState(false);
    const [loadingAgentsMap, setLoadingAgentsMap] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [selectedManagerId, setSelectedManagerId] = useState<string>("");
    const [selectedCounselorId, setSelectedCounselorId] = useState<string>("");

    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role);
    const isAgent = session?.user?.role === "AGENT";

    useEffect(() => {
        if (isOpen) {
            setSelectedManagerId("");
            setSelectedCounselorId("");
            fetchAllOptions();
        }
    }, [isOpen, session]);

    const fetchAllOptions = async () => {
        setIsLoadingAgents(true);
        try {
            if (isAdmin) {
                // Fetch Agents/Managers
                const agentRoles = ["AGENT", "SALES_REP"];
                const agentRes = await Promise.all(agentRoles.map(role =>
                    axios.get(`/api/employees?role=${role}&status=active&limit=100`)
                ));
                const allAgents = agentRes.flatMap(r => r.data.employees);
                allAgents.sort((a, b) => a.name.localeCompare(b.name));
                setAgents(allAgents);

                // Fetch ALL Counselors
                const counselorRes = await axios.get("/api/employees?role=COUNSELOR&status=active&limit=200");
                setAgentCounselors({ "all": counselorRes.data.employees });
            } else if (isAgent) {
                const response = await axios.get("/api/employees?role=COUNSELOR&status=active&limit=100");
                setAgentCounselors({ "direct": response.data.employees });
            }
        } catch (error) {
            toast.error("Failed to load assignment options");
        } finally {
            setIsLoadingAgents(false);
        }
    };

    const handleManagerChange = async (value: string) => {
        setSelectedManagerId(value);
        setSelectedCounselorId("");

        if (value && !agentCounselors[value]) {
            setLoadingAgentsMap(prev => ({ ...prev, [value]: true }));
            try {
                const response = await axios.get(`/api/employees?role=COUNSELOR&status=active&agentId=${value}&limit=100`);
                setAgentCounselors(prev => ({ ...prev, [value]: response.data.employees }));
            } catch (error) {
                toast.error("Failed to load counselors for this manager");
            } finally {
                setLoadingAgentsMap(prev => ({ ...prev, [value]: false }));
            }
        }
    };

    const handleAssignClick = () => {
        const finalAssigneeId = (selectedCounselorId && selectedCounselorId !== "none") 
            ? selectedCounselorId 
            : (selectedManagerId && selectedManagerId !== "none") 
                ? selectedManagerId 
                : null;
        
        if (finalAssigneeId) {
            handleAssign(finalAssigneeId);
        } else {
            toast.error("Please select a staff member");
        }
    };

    const handleAssign = async (employeeId: string) => {
        if (!leadId || !employeeId) return;

        setIsSaving(true);
        try {
            await axios.patch(`/api/leads/${leadId}`, {
                assignedTo: employeeId,
            });
            toast.success("Lead assigned successfully");
            onAssign();
            onClose();
        } catch (error: any) {
            console.error("Failed to assign lead", error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                toast.error("Your session has expired. Please log in again.");
                signOut({ callbackUrl: prefixPath("/login") });
            } else {
                toast.error("Failed to assign lead");
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="overflow-y-auto w-full sm:max-w-sm">
                <SheetHeader>
                    <SheetTitle>Assign Lead</SheetTitle>
                    <SheetDescription>
                        Select an agent and optionally a counselor to assign <strong>{leadName}</strong>.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-8 space-y-6">
                    {isLoadingAgents ? (
                        <div className="flex justify-center py-8 text-muted-foreground animate-pulse">
                            Loading staff...
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {isAdmin && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Agent (Optional)</Label>
                                        <Select value={selectedManagerId} onValueChange={handleManagerChange}>
                                            <SelectTrigger className="w-full h-12 rounded-xl bg-slate-50 border-slate-200">
                                                <SelectValue placeholder="Select Agent" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-xl border-slate-200">
                                                <SelectItem value="none" className="py-2">None (Independent Counselor)</SelectItem>
                                                {agents.map((agent) => (
                                                    <SelectItem key={agent.id} value={agent.id} className="cursor-pointer py-3 rounded-lg focus:bg-primary/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                                {agent.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm">{agent.name}</p>
                                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{agent.role}</p>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Counselor (Optional)</Label>
                                        <Select value={selectedCounselorId} onValueChange={setSelectedCounselorId}>
                                            <SelectTrigger className="w-full h-12 rounded-xl bg-slate-50 border-slate-200">
                                                <SelectValue placeholder="Select Counselor" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-xl border-slate-200">
                                                <SelectItem value="none" className="py-2">No Counselor (Assign to Agent)</SelectItem>
                                                {((selectedManagerId && selectedManagerId !== "none") 
                                                    ? agentCounselors[selectedManagerId] 
                                                    : agentCounselors["all"])?.map((counselor) => (
                                                    <SelectItem key={counselor.id} value={counselor.id} className="cursor-pointer py-3 rounded-lg focus:bg-primary/5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                            <span className="text-sm font-medium">{counselor.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {isAgent && (
                                <div className="space-y-2">
                                    <Label>Counselor</Label>
                                    <Select value={selectedCounselorId} onValueChange={setSelectedCounselorId}>
                                        <SelectTrigger className="w-full h-12 rounded-xl bg-slate-50 border-slate-200">
                                            <SelectValue placeholder="Select Counselor" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-slate-200">
                                            {agentCounselors["direct"]?.map((counselor) => (
                                                <SelectItem key={counselor.id} value={counselor.id} className="cursor-pointer py-3 rounded-lg focus:bg-primary/5">
                                                    <span className="text-sm font-medium">{counselor.name}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 mt-10 pt-6 border-t">
                    <Button
                        onClick={handleAssignClick}
                        disabled={isSaving || (!selectedManagerId && !selectedCounselorId) || (selectedManagerId === "none" && selectedCounselorId === "none")}
                        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 transition-all font-semibold shadow-lg shadow-primary/20"
                    >
                        {isSaving ? "Assigning..." : "Assign Lead"}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSaving}
                        className="w-full h-12 rounded-xl text-slate-500 hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
