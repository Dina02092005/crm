"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { toast } from "sonner";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCreateLead } from "@/hooks/use-leads";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phone: z.string().min(10, "Phone must be at least 10 digits"),
    message: z.string().optional(),
    source: z.enum(["WEBSITE_1", "WEBSITE_2", "WEBSITE_3", "WEBSITE_4"]),
});

type CreateLeadFormData = z.infer<typeof formSchema>;

function ErrorMessage({ field }: { field: any }) {
    // Only show error if the field has been touched and has errors
    if (!field.state.meta.isTouched || !field.state.meta.errors.length) return null

    return (
        <p className="text-sm text-red-500">
            {field.state.meta.errors
                .map((e: any) => (typeof e === 'object' && e?.message ? e.message : e))
                .join(', ')}
        </p>
    )
}

export function CreateLeadSheet({ onLeadCreated }: { onLeadCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const createLeadMutation = useCreateLead();

    const form = useForm({
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            message: "",
            source: "WEBSITE_1" as const,
        } as CreateLeadFormData,
        // @ts-ignore
        validatorAdapter: zodValidator(),
        validators: {
            onChange: formSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                await createLeadMutation.mutateAsync(value);
                toast.success("Lead created successfully");
                setOpen(false);
                form.reset();
                onLeadCreated();
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Failed to create lead");
            }
        },
    });


    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 font-bold shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Add New Lead
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
                <div className="p-6 pb-2">
                    <SheetHeader>
                        <SheetTitle>Add New Lead</SheetTitle>
                        <SheetDescription>
                            Create a new lead manually.
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-2">
                    <form
                        id="create-lead-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                        className="space-y-4"
                    >
                        <form.Field
                            name="name"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                    <ErrorMessage field={field} />
                                </div>
                            )}
                        />
                        <form.Field
                            name="email"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email (Optional)</Label>
                                    <Input
                                        id="email"
                                        placeholder="john@example.com"
                                        value={field.state.value || ""}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                    <ErrorMessage field={field} />
                                </div>
                            )}
                        />
                        <form.Field
                            name="phone"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <PhoneInput
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(value) => field.handleChange(value)}
                                    />
                                    <ErrorMessage field={field} />
                                </div>
                            )}
                        />
                        <form.Field
                            name="source"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="source">Source</Label>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={(v) => field.handleChange(v as any)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select source" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="WEBSITE_1">Website 1</SelectItem>
                                            <SelectItem value="WEBSITE_2">Website 2</SelectItem>
                                            <SelectItem value="WEBSITE_3">Website 3</SelectItem>
                                            <SelectItem value="WEBSITE_4">Website 4</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <ErrorMessage field={field} />
                                </div>
                            )}
                        />
                        <form.Field
                            name="message"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="message">Message (Optional)</Label>
                                    <Input
                                        id="message"
                                        placeholder="Inquiry about..."
                                        value={field.state.value || ""}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                    <ErrorMessage field={field} />
                                </div>
                            )}
                        />
                    </form>
                </div>

                <div className="p-6 border-t bg-background sticky bottom-0 flex justify-end gap-3 custom-sheet-footer">
                    <SheetClose asChild>
                        <Button variant="outline" className="rounded-xl">Cancel</Button>
                    </SheetClose>
                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                        children={([canSubmit, isSubmitting]) => (
                            <Button
                                onClick={() => form.handleSubmit()}
                                className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold px-6 shadow-sm"
                                disabled={createLeadMutation.isPending || !canSubmit}
                            >
                                {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
                            </Button>
                        )}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
