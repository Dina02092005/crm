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
import { useSession } from "next-auth/react";

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
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="overflow-y-auto w-full sm:max-w-sm">
                <SheetHeader>
                    <SheetTitle>Assign Lead</SheetTitle>
                    <SheetDescription>
                        Assign <strong>{leadName}</strong> to an employee.
                    </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 mt-6">
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

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={onClose} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssign}
                            disabled={!selectedEmployee || isSaving}
                            className="bg-cyan-600 hover:bg-cyan-700"
                        >
                            {isSaving ? "Assigning..." : "Assign Lead"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
