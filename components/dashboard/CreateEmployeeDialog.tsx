"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import EmployeeForm from "@/components/forms/EmployeeForm";

export function CreateEmployeeDialog({ onEmployeeCreated, title = "Employee" }: { onEmployeeCreated: () => void, title?: string }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-cyan-600 hover:bg-cyan-700 rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Add {title}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New {title}</DialogTitle>
                    <DialogDescription>
                        Create a new {title.toLowerCase()} account. They will receive an email with their login credentials.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <EmployeeForm
                        title={title}
                        onSuccess={() => {
                            setOpen(false);
                            onEmployeeCreated();
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
