"use client";

import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import EmployeeForm from "@/components/forms/EmployeeForm";

export function CreateEmployeeSheet({ onEmployeeCreated }: { onEmployeeCreated: () => void }) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="bg-cyan-600 hover:bg-cyan-700 rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto w-full sm:max-w-sm">
                <SheetHeader>
                    <SheetTitle>Add New Employee</SheetTitle>
                    <SheetDescription>
                        Create a new employee account. They will receive an email with their login credentials.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                    <EmployeeForm
                        onSuccess={() => {
                            setOpen(false);
                            onEmployeeCreated();
                        }}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
