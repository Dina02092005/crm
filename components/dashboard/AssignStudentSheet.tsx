"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, UserCheck, User } from "lucide-react";
import { useRolePath } from "@/hooks/use-role-path";

interface AssignStudentSheetProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
    onUpdate: () => void;
    currentAgentId?: string;
    currentCounselorId?: string;
}

interface Employee {
    id: string;
    name: string;
    role: string;
    email: string;
}

export function AssignStudentSheet({
    isOpen,
    onClose,
    studentId,
    studentName,
    onUpdate,
    currentAgentId,
    currentCounselorId
}: AssignStudentSheetProps) {
    const { data: session } = useSession() as any;
    const [agents, setAgents] = useState<Employee[]>([]);
    const [agentCounselors, setAgentCounselors] = useState<Record<string, Employee[]>>({});
    const [selectedAgentId, setSelectedAgentId] = useState<string>("");
    const [selectedCounselorId, setSelectedCounselorId] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [loadingAgentsMap, setLoadingAgentsMap] = useState<Record<string, boolean>>({});

    const isAdmin = ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session?.user?.role);
    const isAgent = ["AGENT", "SALES_REP"].includes(session?.user?.role);

    useEffect(() => {
        if (isOpen) {
            setSelectedAgentId(currentAgentId || "none");
            setSelectedCounselorId(currentCounselorId || "none");
            fetchAllOptions();
        }
    }, [isOpen, session, currentAgentId, currentCounselorId]);

    const fetchAllOptions = async () => {
        setIsLoadingOptions(true);
        try {
            if (isAdmin) {
                // Fetch Agents/Managers
                const agentRoles = ["AGENT", "SALES_REP", "MANAGER"];
                const agentRes = await Promise.all(agentRoles.map(role =>
                    axios.get(`/api/employees?role=${role}&status=active&limit=100`)
                ));
                const allAgents = agentRes.flatMap(r => r.data.employees);
                allAgents.sort((a, b) => a.name.localeCompare(b.name));
                setAgents(allAgents);

                // Fetch ALL Counselors
                const counselorRes = await axios.get("/api/employees?role=COUNSELOR&status=active&limit=200");
                setAgentCounselors(prev => ({ ...prev, "all": counselorRes.data.employees }));
            } else if (isAgent) {
                // Agent can only see their own counselors
                const response = await axios.get("/api/employees?role=COUNSELOR&status=active&limit=100");
                setAgentCounselors(prev => ({ ...prev, "direct": response.data.employees }));
            }
        } catch (error) {
            toast.error("Failed to load assignment options");
        } finally {
            setIsLoadingOptions(false);
        }
    };

    const handleAgentChange = async (value: string) => {
        setSelectedAgentId(value);
        setSelectedCounselorId("none");
        if (value && value !== "none" && !agentCounselors[value]) {
            setLoadingAgentsMap(prev => ({ ...prev, [value]: true }));
            try {
                const response = await axios.get(`/api/employees?role=COUNSELOR&agentId=${value}&status=active`);
                setAgentCounselors(prev => ({ ...prev, [value]: response.data.employees }));
            } catch (error) {
                toast.error("Failed to load counselors for this manager");
            } finally {
                setLoadingAgentsMap(prev => ({ ...prev, [value]: false }));
            }
        }
    };

    const handleAssign = async () => {
        setIsSubmitting(true);
        try {
            let agentIdToSet = selectedAgentId;
            if (isAgent) {
                agentIdToSet = session.user.id;
            }

            const data = {
                agentId: agentIdToSet === "none" ? "" : agentIdToSet,
                counselorId: selectedCounselorId === "none" ? "" : selectedCounselorId,
            };

            await axios.patch(`/api/students/${studentId}`, data);
            toast.success("Student assigned successfully");
            onUpdate();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to assign student");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-md border-l border-border shadow-2xl p-0 flex flex-col h-full bg-background">
                <div className="p-6 border-b border-border bg-muted/40">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <UserCheck className="h-5 w-5 text-primary" />
                            </div>
                            <SheetTitle className="text-xl font-bold tracking-tight">Assign Student</SheetTitle>
                        </div>
                        <SheetDescription className="text-sm text-muted-foreground">
                            Assign <span className="font-semibold text-foreground">{studentName}</span> to a staff member for processing.
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {isLoadingOptions ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                            <p className="text-sm text-muted-foreground animate-pulse font-medium">Loading staff...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {isAdmin && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Agent / Manager (Optional)</Label>
                                        <Select value={selectedAgentId} onValueChange={handleAgentChange}>
                                            <SelectTrigger className="w-full h-12 rounded-xl bg-muted/20 border-border focus:ring-primary/20">
                                                <SelectValue placeholder="Select Agent" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-xl border-border">
                                                <SelectItem value="none" className="py-2">None (Independent Counselor)</SelectItem>
                                                {agents.map((agent) => (
                                                    <SelectItem key={agent.id} value={agent.id} className="cursor-pointer py-3 rounded-lg focus:bg-primary/5">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8 rounded-full">
                                                                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                                                    {agent.name.charAt(0)}
                                                                </AvatarFallback>
                                                            </Avatar>
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
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Counselor (Optional)</Label>
                                        <Select value={selectedCounselorId} onValueChange={setSelectedCounselorId}>
                                            <SelectTrigger className="w-full h-12 rounded-xl bg-muted/20 border-border focus:ring-primary/20">
                                                <SelectValue placeholder={loadingAgentsMap[selectedAgentId] ? "Loading..." : "Select Counselor"} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-xl border-border">
                                                <SelectItem value="none" className="py-2">No Counselor</SelectItem>
                                                {((selectedAgentId && selectedAgentId !== "none") 
                                                    ? agentCounselors[selectedAgentId] 
                                                    : agentCounselors["all"])?.map((counselor) => (
                                                    <SelectItem key={counselor.id} value={counselor.id} className="cursor-pointer py-3 rounded-lg focus:bg-primary/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                                <User className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                            <span className="text-sm font-medium">{counselor.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            {isAgent && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Counselor</Label>
                                    <Select value={selectedCounselorId} onValueChange={setSelectedCounselorId}>
                                        <SelectTrigger className="w-full h-12 rounded-xl bg-muted/20 border-border focus:ring-primary/20">
                                            <SelectValue placeholder="Select Counselor" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-border">
                                            <SelectItem value="none" className="py-2">Assign to Myself</SelectItem>
                                            {agentCounselors["direct"]?.map((counselor) => (
                                                <SelectItem key={counselor.id} value={counselor.id} className="py-3">
                                                    {counselor.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border bg-muted/40 mt-auto">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-xl border-border hover:bg-muted"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-primary-foreground"
                            onClick={handleAssign}
                            disabled={isSubmitting || isLoadingOptions}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                "Update Assignment"
                            )}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
