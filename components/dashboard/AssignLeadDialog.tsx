"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
import { useSession } from "next-auth/react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AssignLeadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string | null;
    leadName: string | null;
    onAssign: () => void;
}

export function AssignLeadDialog({
    isOpen,
    onClose,
    leadId,
    leadName,
    onAssign,
}: AssignLeadDialogProps) {
    const { data: session } = useSession() as any;
    const [agents, setAgents] = useState<any[]>([]);
    const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({});
    const [agentCounselors, setAgentCounselors] = useState<Record<string, any[]>>({});
    const [isLoadingAgents, setIsLoadingAgents] = useState(false);
    const [loadingAgentsMap, setLoadingAgentsMap] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);

    const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";
    const isAgent = session?.user?.role === "AGENT";

    useEffect(() => {
        if (isOpen) {
            if (isAdmin) {
                fetchAgents();
            } else if (isAgent) {
                fetchDirectCounselors();
            }
        }
    }, [isOpen, session]);

    const fetchAgents = async () => {
        setIsLoadingAgents(true);
        try {
            const response = await axios.get("/api/employees?role=AGENT&status=active&limit=100");
            setAgents(response.data.employees);
        } catch (error) {
            console.error("Failed to fetch agents", error);
            toast.error("Failed to load agents");
        } finally {
            setIsLoadingAgents(false);
        }
    };

    const fetchDirectCounselors = async () => {
        try {
            const response = await axios.get("/api/employees?role=COUNSELOR&status=active&limit=100");
            const emps = response.data.employees;
            setAgentCounselors({ "direct": emps });
            setExpandedAgents({ "direct": true });
        } catch (error) {
            toast.error("Failed to load counselors");
        }
    };

    const toggleAgent = async (agentId: string) => {
        const isExpanded = !!expandedAgents[agentId];

        if (!isExpanded && !agentCounselors[agentId]) {
            setLoadingAgentsMap(prev => ({ ...prev, [agentId]: true }));
            try {
                const response = await axios.get(`/api/employees?role=COUNSELOR&status=active&agentId=${agentId}&limit=100`);
                setAgentCounselors(prev => ({ ...prev, [agentId]: response.data.employees }));
            } catch (error) {
                toast.error("Failed to load counselors for this agent");
            } finally {
                setLoadingAgentsMap(prev => ({ ...prev, [agentId]: false }));
            }
        }

        setExpandedAgents(prev => ({
            ...prev,
            [agentId]: !isExpanded
        }));
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
            setExpandedAgents({});
        } catch (error) {
            console.error("Failed to assign lead", error);
            toast.error("Failed to assign lead");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle>Assign Lead</DialogTitle>
                    <DialogDescription>
                        Select a counselor to assign <strong>{leadName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {isLoadingAgents ? (
                        <div className="flex justify-center py-8 text-muted-foreground animate-pulse">
                            Loading agents...
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {isAdmin && agents.map((agent) => (
                                <div key={agent.id} className="border border-border/40 rounded-xl overflow-hidden shadow-sm">
                                    <button
                                        onClick={() => toggleAgent(agent.id)}
                                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                {agent.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{agent.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-0.5">Agent</p>
                                            </div>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: expandedAgents[agent.id] ? 180 : 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                        </motion.div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedAgents[agent.id] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden bg-slate-50/50"
                                            >
                                                <div className="p-2 space-y-1 border-t border-border/30">
                                                    {loadingAgentsMap[agent.id] ? (
                                                        <div className="p-4 text-center text-xs text-muted-foreground">Loading counselors...</div>
                                                    ) : agentCounselors[agent.id]?.length === 0 ? (
                                                        <div className="p-4 text-center text-xs text-red-400 italic">No active counselors found</div>
                                                    ) : (
                                                        agentCounselors[agent.id]?.map((counselor) => (
                                                            <button
                                                                key={counselor.id}
                                                                onClick={() => handleAssign(counselor.id)}
                                                                disabled={isSaving}
                                                                className="w-full text-left p-3 rounded-lg hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-between group"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-primary transition-colors" />
                                                                    <span className="text-sm font-medium">{counselor.name}</span>
                                                                </div>
                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">Assign</span>
                                                                </div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}

                            {isAgent && agentCounselors["direct"]?.map((counselor) => (
                                <button
                                    key={counselor.id}
                                    onClick={() => handleAssign(counselor.id)}
                                    disabled={isSaving}
                                    className="w-full text-left p-4 rounded-xl border border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                                            {counselor.name.charAt(0)}
                                        </div>
                                        <span className="font-semibold text-sm">{counselor.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Assign Now</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-slate-50/50">
                    <Button variant="outline" onClick={onClose} disabled={isSaving} className="rounded-xl">
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
