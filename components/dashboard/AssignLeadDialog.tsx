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
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && (session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER")) {
            fetchEmployees();
        }
    }, [isOpen, session]);

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            // Fetch only active employees
            const response = await axios.get("/api/employees?status=active&limit=100");
            setEmployees(response.data.employees);
        } catch (error) {
            console.error("Failed to fetch employees", error);
            toast.error("Failed to load employees");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!leadId || !selectedEmployee) return;

        setIsSaving(true);
        try {
            await axios.patch(`/api/leads/${leadId}`, {
                assignedTo: selectedEmployee,
            });
            toast.success("Lead assigned successfully");
            onAssign();
            onClose();
            setSelectedEmployee("");
        } catch (error) {
            console.error("Failed to assign lead", error);
            toast.error("Failed to assign lead");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Lead</DialogTitle>
                    <DialogDescription>
                        Assign <strong>{leadName}</strong> to an employee.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="employee">Select Employee</Label>
                        <Select
                            value={selectedEmployee}
                            onValueChange={setSelectedEmployee}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={isLoading ? "Loading..." : "Select an employee"} />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id}>
                                        {emp.name} ({emp.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedEmployee || isSaving}
                        className="bg-teal-600 hover:bg-teal-700"
                    >
                        {isSaving ? "Assigning..." : "Assign Lead"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
