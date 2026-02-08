"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { SheetFooter, SheetClose } from "@/components/ui/sheet";

interface LeadFormProps {
    leadId: string;
    onSuccess: () => void;
}

export function LeadForm({ leadId, onSuccess }: LeadFormProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        source: "",
        status: "",
        temperature: "",
        message: "",
    });

    useEffect(() => {
        const fetchLead = async () => {
            try {
                const response = await axios.get(`/api/leads/${leadId}`);
                const lead = response.data;
                setFormData({
                    name: lead.name || "",
                    email: lead.email || "",
                    phone: lead.phone || "",
                    source: lead.source || "",
                    status: lead.status || "",
                    temperature: lead.temperature || "",
                    message: lead.message || "",
                });
            } catch (error) {
                toast.error("Failed to load lead details");
            } finally {
                setIsLoading(false);
            }
        };

        if (leadId) fetchLead();
    }, [leadId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await axios.patch(`/api/leads/${leadId}`, formData);
            toast.success("Lead updated successfully");
            onSuccess();
        } catch (error) {
            toast.error("Failed to update lead");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-4">Loading lead details...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="rounded-xl"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-xl"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="rounded-xl"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select
                    value={formData.source}
                    onValueChange={(v) => setFormData({ ...formData, source: v })}
                >
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="WEBSITE_1">Website 1</SelectItem>
                        <SelectItem value="WEBSITE_2">Website 2</SelectItem>
                        <SelectItem value="WEBSITE_3">Website 3</SelectItem>
                        <SelectItem value="WEBSITE_4">Website 4</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
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
            <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Select
                    value={formData.temperature}
                    onValueChange={(v) => setFormData({ ...formData, temperature: v })}
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

            <div className="space-y-2">
                <Label htmlFor="message">Note/Message</Label>
                <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full min-h-[100px] p-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
            </div>

            <SheetFooter className="gap-2">
                <SheetClose asChild>
                    <Button variant="outline" type="button" className="rounded-xl">Cancel</Button>
                </SheetClose>
                <Button type="submit" className="rounded-xl" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </SheetFooter>
        </form>
    );
}
