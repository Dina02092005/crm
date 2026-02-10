"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import CustomerForm from "@/components/forms/CustomerForm";
import {
    ArrowLeft,
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

    // Activity Pagination State
    const [activities, setActivities] = useState<any[]>([]);
    const [activityPagination, setActivityPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 10
    });
    const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);

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
            // Initial activities are already included in customer data, 
            // but we'll fetch them separately for pagination consistency if needed.
            // For now, we'll set the initial page and then the fetchActivities will handle changes.
            if (response.data.lead?.id) {
                fetchActivities(1, response.data.lead.id);
            }
        } catch (error) {
            toast.error("Failed to fetch customer details");
            router.push("/customers");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchActivities = async (page: number, leadId?: string, limitOverride?: number) => {
        const targetLeadId = leadId || customer?.lead?.id;
        const currentLimit = limitOverride || activityPagination.limit;
        if (!targetLeadId) return;

        setIsActivitiesLoading(true);
        try {
            const response = await axios.get(`/api/leads/${targetLeadId}/activities?page=${page}&limit=${currentLimit}`);
            setActivities(response.data.activities);
            setActivityPagination({
                ...activityPagination,
                page: response.data.pagination.page,
                totalPages: response.data.pagination.totalPages,
                total: response.data.pagination.total,
                limit: currentLimit
            });
        } catch (error) {
            console.error("Failed to fetch activities:", error);
            toast.error("Failed to fetch activity history");
        } finally {
            setIsActivitiesLoading(false);
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Profile Card */}
                <div className="lg:col-span-1 space-y-6">
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
                                    className="w-full bg-primary hover:bg-primary/90 rounded-xl h-9 text-sm font-bold shadow-sm"
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
                <div className="lg:col-span-2">
                    <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden flex flex-col h-full">
                        <CardHeader className="pb-2 border-b border-border/50">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                Activity History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col">
                            {isActivitiesLoading ? (
                                <div className="flex-1 flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : activities && activities.length > 0 ? (
                                <div className="flex-1 overflow-y-auto">
                                    <div className="divide-y divide-border/50">
                                        {activities.map((activity: any) => (
                                            <div
                                                key={activity.id}
                                                className="p-4 hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="text-[9px] font-bold uppercase py-0 px-2 rounded-md bg-primary/10 text-primary border-0">
                                                            {activity.type.replace("_", " ")}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground font-medium">
                                                            {new Date(activity.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground font-medium italic">
                                                        {activity.user?.name || "System"}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-foreground/90 leading-relaxed">{activity.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-16 text-muted-foreground/50">
                                    <History className="h-10 w-10 mb-3 opacity-10" />
                                    <p className="text-xs font-medium italic tracking-tight">No activity recorded yet</p>
                                </div>
                            )}

                            {/* Activity Pagination Controls */}
                            <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground font-medium">Rows per page</p>
                                    <Select
                                        value={activityPagination.limit.toString()}
                                        onValueChange={(value) => {
                                            setActivityPagination(prev => ({ ...prev, limit: Number(value), page: 1 }));
                                            // We need to fetch immediately or use an effect. 
                                            // Since fetchActivities depends on state, passing the new limit directly is safer
                                            // or we can use a useEffect. But here let's just call it.
                                            // Actually, fetchActivities uses state, so state update might not be reflected yet.
                                            // Better to modify fetchActivities to accept limit or use a useEffect.
                                            // Let's rely on a useEffect for limit changes if possible, or pass it.
                                            // The simplest way without big refactor:
                                            setTimeout(() => fetchActivities(1, undefined, Number(value)), 0);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-[60px] text-xs bg-background border-border/50">
                                            <SelectValue placeholder={activityPagination.limit} />
                                        </SelectTrigger>
                                        <SelectContent side="top">
                                            {[5, 10, 20, 50].map((pageSize) => (
                                                <SelectItem key={pageSize} value={pageSize.toString()} className="text-xs">
                                                    {pageSize}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-xs text-muted-foreground font-medium">
                                        {activityPagination.total > 0
                                            ? `${(activityPagination.page - 1) * activityPagination.limit + 1}-${Math.min(activityPagination.page * activityPagination.limit, activityPagination.total)} of ${activityPagination.total}`
                                            : "No activities"}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-lg text-xs border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
                                            onClick={() => fetchActivities(activityPagination.page - 1)}
                                            disabled={activityPagination.page <= 1 || isActivitiesLoading}
                                        >
                                            &lt;
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-lg text-xs border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
                                            onClick={() => fetchActivities(activityPagination.page + 1)}
                                            disabled={activityPagination.page >= activityPagination.totalPages || isActivitiesLoading}
                                        >
                                            &gt;
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Edit Customer Sheet */}
            <Sheet open={showEditDialog} onOpenChange={setShowEditDialog}>
                <SheetContent className="overflow-y-auto w-full sm:max-w-md flex flex-col p-0">
                    <div className="p-6 pb-2">
                        <SheetHeader>
                            <SheetTitle>Edit Customer</SheetTitle>
                            <SheetDescription>
                                Update customer details.
                            </SheetDescription>
                        </SheetHeader>
                    </div>
                    <div className="flex-1 px-6">
                        <CustomerForm
                            formId="edit-customer-form"
                            customer={customer}
                            onSuccess={() => {
                                setShowEditDialog(false);
                                fetchCustomer();
                                toast.success("Customer updated successfully");
                            }}
                        />
                    </div>
                    <div className="p-6 pt-2 mt-auto border-t">
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" form="edit-customer-form" className="bg-primary hover:bg-primary/90 text-white">
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

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
