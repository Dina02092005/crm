"use client";

import { useState } from "react";
import {
    Sheet,
    SheetClose,
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
            <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
                <div className="p-6 pb-2">
                    <SheetHeader>
                        <SheetTitle>Add New Employee</SheetTitle>
                        <SheetDescription>
                            Create a new employee account. They will receive an email.
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-2">
                    <EmployeeForm
                        formId="create-employee-form"
                        onSuccess={() => {
                            setOpen(false);
                            onEmployeeCreated();
                        }}
                    />
                </div>

                <div className="p-6 border-t bg-background sticky bottom-0 flex justify-end gap-3 custom-sheet-footer">
                    <SheetClose asChild>
                        <Button variant="outline" className="rounded-xl">Cancel</Button>
                    </SheetClose>
                    <Button type="submit" form="create-employee-form" className="rounded-xl bg-cyan-600 hover:bg-cyan-700">
                        Create Employee
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
