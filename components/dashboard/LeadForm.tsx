"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { SheetFooter, SheetClose } from "@/components/ui/sheet";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";

interface LeadFormProps {
    leadId: string;
    onSuccess: () => void;
}

const leadSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().min(10, "Phone must be at least 10 digits"),
    source: z.string().optional(),
    status: z.string().optional(),
    temperature: z.string().optional(),
    message: z.string().optional(),
    imageUrl: z.string().nullable(),
});

type LeadFormData = z.infer<typeof leadSchema>;

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


export function LeadForm({ leadId, onSuccess }: LeadFormProps) {
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm({
        // @ts-ignore
        validatorAdapter: zodValidator(),

        defaultValues: {
            name: "",
            email: "",
            phone: "",
            source: "",
            status: "",
            temperature: "",
            message: "",
            imageUrl: null,
        } as LeadFormData,
        validators: {
            onChange: leadSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                await axios.patch(`/api/leads/${leadId}`, value);
                toast.success("Lead updated successfully");
                onSuccess();
            } catch (error) {
                toast.error("Failed to update lead");
            }
        },
    });

    const [websites, setWebsites] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        const fetchLead = async () => {
            try {
                const response = await axios.get(`/api/leads/${leadId}`);
                const lead = response.data;
                form.reset({
                    name: lead.name || "",
                    email: lead.email || "",
                    phone: lead.phone || "",
                    source: lead.source || "",
                    status: lead.status || "",
                    temperature: lead.temperature || "",
                    message: lead.message || "",
                    imageUrl: lead.imageUrl || null,
                });
            } catch (error) {
                toast.error("Failed to load lead details");
            } finally {
                setIsLoading(false);
            }
        };

        const fetchWebsites = async () => {
            try {
                const res = await axios.get("/api/websites");
                setWebsites(res.data);
            } catch (error) {
                console.error("Failed to load websites", error);
            }
        };

        if (leadId) fetchLead();
        fetchWebsites();
    }, [leadId]);

    if (isLoading) {
        return <div className="p-4">Loading lead details...</div>;
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
            }}
            className="space-y-6 mt-6"
        >
            <div className="flex justify-center">
                <form.Field
                    name="imageUrl"
                    children={(field) => (
                        <ImageUpload
                            value={field.state.value}
                            onChange={(url) => field.handleChange(url)}
                            onRemove={() => field.handleChange(null)}
                        />
                    )}
                />
            </div>

            <form.Field
                name="name"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="rounded-xl"
                        />
                        {field.state.meta.errors ? (
                            <p className="text-sm text-red-500">{field.state.meta.errors.join(", ")}</p>
                        ) : null}
                    </div>
                )}
            />

            <form.Field
                name="email"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={field.state.value || ""}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="rounded-xl"
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
                        <Label htmlFor="phone">Phone Number</Label>
                        <PhoneInput
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(value) => field.handleChange(value)}
                            className="rounded-xl"
                            error={!!field.state.meta.errors.length && field.state.meta.isTouched}
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
                            onValueChange={(v) => field.handleChange(v)}
                        >
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                                {websites.map((site) => (
                                    <SelectItem key={site.id} value={site.name}>
                                        {site.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            />

            <form.Field
                name="status"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={field.state.value}
                            onValueChange={(v) => field.handleChange(v)}
                        >
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NEW">New</SelectItem>
                                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                                <SelectItem value="CONVERTED">Converted</SelectItem>
                                <SelectItem value="LOST">Lost</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            />

            <form.Field
                name="temperature"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor="temperature">Temperature</Label>
                        <Select
                            value={field.state.value}
                            onValueChange={(v) => field.handleChange(v)}
                        >
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Select temperature" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="COLD">Cold</SelectItem>
                                <SelectItem value="WARM">Warm</SelectItem>
                                <SelectItem value="HOT">Hot</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            />

            <form.Field
                name="message"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor="message">Note/Message</Label>
                        <textarea
                            id="message"
                            value={field.state.value || ""}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full min-h-[100px] p-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                )}
            />

            <SheetFooter className="gap-2">
                <SheetClose asChild>
                    <Button variant="outline" type="button" className="rounded-xl">Cancel</Button>
                </SheetClose>
                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                        <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-sm px-8" disabled={!canSubmit}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    )}
                />
            </SheetFooter>
        </form>
    );
}
