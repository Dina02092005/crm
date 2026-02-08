"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    Calendar,
    Briefcase,
    History,
    Pencil,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession() as any;
    const [customer, setCustomer] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditDialog, setShowEditDialog] = useState(false);

    // Confirm Dialog State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        description: "",
        confirmText: "Confirm",
        variant: "default" as "default" | "destructive",
        onConfirm: async () => { },
        isLoading: false,
    });

    const openConfirm = (
        title: string,
        description: string,
        onConfirm: () => Promise<void>,
        variant: "default" | "destructive" = "default",
        confirmText = "Confirm"
    ) => {
        setConfirmConfig({
            isOpen: true,
            title,
            description,
            confirmText,
            variant,
            onConfirm,
            isLoading: false,
        });
    };

    const handleConfirmAction = async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        try {
            await confirmConfig.onConfirm();
            setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error("Confirmation action failed", error);
        } finally {
            setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        }
    };

    const fetchCustomer = async () => {
        try {
            const response = await axios.get(`/api/customers/${params.id}`);
            setCustomer(response.data);
        } catch (error) {
            toast.error("Failed to fetch customer details");
            router.push("/customers");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateCustomer = async (e: any) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            phone: formData.get("phone"),
        };

        try {
            await axios.patch(`/api/customers/${params.id}`, data);
            toast.success("Customer updated successfully");
            setShowEditDialog(false);
            fetchCustomer();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to update customer");
        }
    };

    const handleDeleteCustomer = () => {
        openConfirm(
            "Delete Customer",
            "Are you sure you want to delete this customer?",
            async () => {
                try {
                    await axios.delete(`/api/customers/${params.id}`);
                    toast.success("Customer deleted successfully");
                    router.push("/customers");
                } catch (error: any) {
                    toast.error(error.response?.data?.error || "Failed to delete customer");
                }
            },
            "destructive",
            "Delete"
        );
    };

    useEffect(() => {
        fetchCustomer();
    }, [params.id]);

    if (isLoading) {
        return (
            <div className="p-10">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!customer) return null;

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl h-8 w-8 hover:bg-muted"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold text-foreground">Customer Details</h1>
                    <p className="text-xs text-muted-foreground">Detailed view of the customer profile</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Customer Profile Card */}
                <div className="col-span-1 space-y-6">
                    <Card className="border border-border rounded-2xl bg-card shadow-none">
                        <CardHeader className="pb-2 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</p>
                                    <CardTitle className="text-lg font-bold">{customer.name}</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-5">
                            <div className="grid gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Contact Information</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Phone</span>
                                            <span className="font-semibold">{customer.phone}</span>
                                        </div>
                                        {customer.email && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Email</span>
                                                <span className="font-semibold">{customer.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">System Info</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Onboarded By</span>
                                            <span className="font-semibold">{customer.user.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Joined</span>
                                            <span className="font-semibold">
                                                {new Date(customer.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border/50 flex flex-col gap-2">
                                <Button
                                    className="w-full bg-primary hover:bg-primary/90 rounded-xl h-9 text-sm"
                                    onClick={() => setShowEditDialog(true)}
                                >
                                    <Pencil className="h-3.5 w-3.5 mr-2" />
                                    Edit Customer
                                </Button>
                                {session?.user?.role === "ADMIN" && (
                                    <Button
                                        variant="ghost"
                                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl h-9 text-sm"
                                        onClick={handleDeleteCustomer}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                                        Delete Customer
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Timeline */}
                <div className="col-span-2">
                    <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden">
                        <CardHeader className="pb-2 border-b border-border/50">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                Activity History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {customer.lead?.activities && customer.lead.activities.length > 0 ? (
                                <div className="divide-y divide-border/50">
                                    {customer.lead.activities.map((activity: any) => (
                                        <div
                                            key={activity.id}
                                            className="p-4 hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="secondary" className="text-[9px] font-bold uppercase py-0 px-2 rounded-md bg-muted/50 border-0">
                                                    {activity.type.replace("_", " ")}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                    {new Date(activity.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground/90 leading-relaxed">{activity.content}</p>
                                            <p className="text-[11px] text-muted-foreground mt-2 font-medium">
                                                — {activity.user?.name || "System"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
                                    <History className="h-10 w-10 mb-3 opacity-10" />
                                    <p className="text-xs font-medium italic tracking-tight">No activity recorded yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Edit Customer Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Customer</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateCustomer}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" name="name" defaultValue={customer.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={customer.email || ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone *</Label>
                                <Input id="phone" name="phone" defaultValue={customer.phone} required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmAction}
                title={confirmConfig.title}
                description={confirmConfig.description}
                confirmText={confirmConfig.confirmText}
                variant={confirmConfig.variant}
                isLoading={confirmConfig.isLoading}
            />
        </div >
    );
}
