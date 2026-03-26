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
import AdminCounsellorForm from "@/components/forms/AdminCounsellorForm";

export function CreateCounsellorSheet({ onCounsellorCreated, title = "Counselor" }: { onCounsellorCreated: () => void, title?: string }) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl h-11 px-6 shadow-sm flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add {title}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
                <div className="p-6 pb-2">
                    <SheetHeader>
                        <SheetTitle>Add New {title}</SheetTitle>
                        <SheetDescription>
                            Create a new {title.toLowerCase()} account in the system.
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-2">
                    <AdminCounsellorForm
                        formId="create-counsellor-form"
                        title={title}
                        onSuccess={() => {
                            setOpen(false);
                            onCounsellorCreated();
                        }}
                    />
                </div>

                <div className="p-6 border-t bg-background sticky bottom-0 flex justify-end gap-3 custom-sheet-footer">
                    <SheetClose asChild>
                        <Button variant="outline" className="rounded-xl">Cancel</Button>
                    </SheetClose>
                    <Button type="submit" form="create-counsellor-form" className="rounded-xl bg-[#10B981] hover:bg-[#059669] text-white">
                        Create Counsellor
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
