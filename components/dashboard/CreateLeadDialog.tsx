"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phone: z.string().min(10, "Phone must be at least 10 digits"),
    message: z.string().optional(),
    source: z.enum(["WEBSITE_1", "WEBSITE_2", "WEBSITE_3", "WEBSITE_4"]),
});

type CreateLeadFormData = z.infer<typeof formSchema>;

import { useCreateLead } from "@/hooks/use-leads";
// ... imports

export function CreateLeadDialog({ onLeadCreated }: { onLeadCreated: () => void }) {
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl px-6">
                    <Plus className="mr-2 h-4 w-4" /> Add New Lead
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Lead</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="space-y-4 pt-4"
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
                                {field.state.meta.errors ? (
                                    <p className="text-sm text-red-500">{field.state.meta.errors.join(", ")}</p>
                                ) : null}
                            </div>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4">
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
                                    {field.state.meta.errors ? (
                                        <p className="text-sm text-red-500">{field.state.meta.errors.join(", ")}</p>
                                    ) : null}
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
                                        onChange={(phone) => field.handleChange(phone)}
                                        error={!!field.state.meta.errors}
                                    />
                                    {field.state.meta.errors ? (
                                        <p className="text-sm text-red-500">{field.state.meta.errors.join(", ")}</p>
                                    ) : null}
                                </div>
                            )}
                        />
                    </div>
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
                                {field.state.meta.errors ? (
                                    <p className="text-sm text-red-500">{field.state.meta.errors.join(", ")}</p>
                                ) : null}
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
                                {field.state.meta.errors ? (
                                    <p className="text-sm text-red-500">{field.state.meta.errors.join(", ")}</p>
                                ) : null}
                            </div>
                        )}
                    />
                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                        children={([canSubmit, isSubmitting]) => (
                            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={createLeadMutation.isPending || !canSubmit}>
                                {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
                            </Button>
                        )}
                    />
                </form>
            </DialogContent>
        </Dialog>
    );
}
