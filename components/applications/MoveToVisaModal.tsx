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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, User, Users, Plane, Info } from "lucide-react";
import { Application } from "@/types/api";

interface MoveToVisaModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: Application | null;
    onSuccess: () => void;
}

export function MoveToVisaModal({
    isOpen,
    onClose,
    application,
    onSuccess,
}: MoveToVisaModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [agents, setAgents] = useState<any[]>([]);
    const [counselors, setCounselors] = useState<any[]>([]);
    const [isLoadingStaff, setIsLoadingStaff] = useState(false);

    const [formData, setFormData] = useState({
        agentId: "",
        counselorId: "",
        appointmentDate: "",
    });

    useEffect(() => {
        if (isOpen) {
            fetchAllStaff();
        } else {
            setFormData({ agentId: "", counselorId: "", appointmentDate: "" });
            setCounselors([]);
            setAgents([]);
        }
    }, [isOpen]);

    const fetchAllStaff = async () => {
        setIsLoadingStaff(true);
        try {
            const [agentsRes, counselorsRes] = await Promise.all([
                axios.get("/api/employees?role=AGENT&limit=100"),
                axios.get("/api/employees?role=COUNSELOR&limit=100")
            ]);
            setAgents(agentsRes.data.employees || []);
            setCounselors(counselorsRes.data.employees || []);
        } catch (error) {
            console.error("Failed to fetch staff:", error);
            toast.error("Failed to load staff list");
        } finally {
            setIsLoadingStaff(false);
        }
    };

    const fetchCounselorsForAgent = async (agentId: string) => {
        if (!agentId) {
            // Restore all counselors if agent is cleared
            const res = await axios.get("/api/employees?role=COUNSELOR&limit=100");
            setCounselors(res.data.employees || []);
            return;
        }
        setIsLoadingStaff(true);
        try {
            const res = await axios.get(`/api/employees?role=COUNSELOR&agentId=${agentId}&limit=100`);
            setCounselors(res.data.employees || []);
        } catch (error) {
            console.error("Failed to fetch counselors:", error);
        } finally {
            setIsLoadingStaff(false);
        }
    };

    const handleAgentChange = (val: string) => {
        const agentId = val === "none" ? "" : val;
        setFormData(prev => ({ ...prev, agentId, counselorId: "" }));
        fetchCounselorsForAgent(agentId);
    };

    const handleSave = async () => {
        if (!application) return;

        setIsSubmitting(true);
        try {
            await axios.post(`/api/applications/${application.id}/ready-for-visa`, {
                agentId: formData.agentId || null,
                counselorId: formData.counselorId || null,
                appointmentDate: formData.appointmentDate || null
            });

            toast.success("Application moved to Visa stage!");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Move to visa failed:", error);
            toast.error(error.response?.data?.error || "Failed to move to Visa stage");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!application) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <Plane className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-bold">Move to Visa Stage</DialogTitle>
                    <DialogDescription>
                        Assign an agent and counselor for <strong>{application.student?.name}</strong>&apos;s visa process.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-5">
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-3 text-amber-800 text-xs">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>This will create a new Visa Application record and hide this entry from the main Applications table.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <User className="h-3 w-3" /> Select Agent (Optional)
                            </Label>
                            <Select value={formData.agentId || "none"} onValueChange={handleAgentChange}>
                                <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder={isLoadingStaff ? "Loading..." : "Select Agent"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="none" className="text-muted-foreground italic">None / Unset</SelectItem>
                                    {agents.map(a => (
                                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <Users className="h-3 w-3" /> Select Counselor (Optional)
                            </Label>
                            <Select
                                value={formData.counselorId || "none"}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, counselorId: val === "none" ? "" : val }))}
                                disabled={isLoadingStaff}
                            >
                                <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder={isLoadingStaff ? "Loading..." : "Select Counselor"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="none" className="text-muted-foreground italic">None / Unset</SelectItem>
                                    {counselors.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Appointment Date (Optional)</Label>
                            <Input
                                type="date"
                                value={formData.appointmentDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                                className="rounded-xl h-11"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/20 border-t border-primary/10 flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="rounded-xl h-11 px-6">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="rounded-xl h-11 px-8 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plane className="h-4 w-4 mr-2" />}
                        Move to Visa
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
