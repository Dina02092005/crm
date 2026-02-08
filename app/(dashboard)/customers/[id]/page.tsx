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
        <div className="p-10">
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </Button>
                <h1 className="text-3xl font-bold text-gray-800">Customer Details</h1>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Customer Profile Card */}
                <div className="col-span-1 space-y-6">
                    <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-b from-blue-500 to-blue-600 text-white p-6 relative">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold">{customer.name}</CardTitle>
                                    <p className="text-blue-100/80 text-sm mt-1">Customer</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-sm text-gray-600">Phone</p>
                                    <p className="font-bold text-gray-900">{customer.phone}</p>
                                </div>
                            </div>
                            {customer.email && (
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="font-medium text-sm text-gray-600">Email</p>
                                        <p className="font-bold text-gray-900">{customer.email}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <Briefcase className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-sm text-gray-600">Onboarded By</p>
                                    <p className="font-bold text-gray-900">{customer.user.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-sm text-gray-600">Joined</p>
                                    <p className="font-bold text-gray-900">
                                        {new Date(customer.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t space-y-2">
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl"
                                    onClick={() => setShowEditDialog(true)}
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Customer
                                </Button>
                                {session?.user?.role === "ADMIN" && (
                                    <Button
                                        variant="outline"
                                        className="w-full border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                                        onClick={handleDeleteCustomer}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Customer
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Timeline */}
                <div className="col-span-2">
                    <Card className="border-0 shadow-sm rounded-3xl">
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Activity Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {customer.lead?.activities && customer.lead.activities.length > 0 ? (
                                <div className="space-y-4">
                                    {customer.lead.activities.map((activity: any) => (
                                        <div
                                            key={activity.id}
                                            className="flex gap-4 pb-4 border-b last:border-0"
                                        >
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <History className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-[9px] font-bold uppercase">
                                                        {activity.type.replace("_", " ")}
                                                    </Badge>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(activity.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{activity.content}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    by {activity.user?.name || "System"}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                    <History className="h-12 w-12 mb-2 opacity-20" />
                                    <p className="text-sm italic">No activity found</p>
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
