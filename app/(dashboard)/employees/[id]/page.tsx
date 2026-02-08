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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    Calendar,
    Briefcase,
    UserCheck,
    Pencil,
    UserX,
    TrendingUp,
    UserCog,
} from "lucide-react";
import { toast } from "sonner";

export default function EmployeeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession() as any;
    const [employee, setEmployee] = useState<any>(null);
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

    const fetchEmployee = async () => {
        try {
            const response = await axios.get(`/api/employees/${params.id}`);
            setEmployee(response.data);
        } catch (error) {
            toast.error("Failed to fetch employee details");
            router.push("/employees");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateEmployee = async (e: any) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            role: formData.get("role"),
            phone: formData.get("phone"),
            department: formData.get("department"),
        };

        try {
            await axios.patch(`/api/employees/${params.id}`, data);
            toast.success("Employee updated successfully");
            setShowEditDialog(false);
            fetchEmployee();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to update employee");
        }
    };

    const handleDeactivateEmployee = () => {
        openConfirm(
            "Deactivate Employee",
            "Are you sure you want to deactivate this employee?",
            async () => {
                try {
                    await axios.delete(`/api/employees/${params.id}`);
                    toast.success("Employee deactivated successfully");
                    router.push("/employees");
                } catch (error: any) {
                    toast.error(error.response?.data?.error || "Failed to deactivate employee");
                }
            },
            "destructive",
            "Deactivate"
        );
    };

    useEffect(() => {
        fetchEmployee();
    }, [params.id]);

    // Check if user has access
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
        return (
            <div className="p-10">
                <Card className="border-0 shadow-sm rounded-3xl">
                    <CardContent className="p-16 text-center">
                        <p className="text-gray-500">You don't have permission to view this page.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

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

    if (!employee) return null;

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
                <h1 className="text-3xl font-bold text-gray-800">Employee Details</h1>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Employee Profile Card */}
                <div className="col-span-1 space-y-6">
                    <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-b from-cyan-500 to-cyan-600 text-white p-6 relative">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                                    {employee.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold">{employee.name}</CardTitle>
                                    <Badge
                                        variant="outline"
                                        className="mt-2 border-white/50 text-white"
                                    >
                                        {employee.role}
                                    </Badge>
                                </div>
                            </div>
                            <Badge
                                variant={employee.isActive ? "default" : "secondary"}
                                className={`absolute top-4 right-4 ${employee.isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                    }`}
                            >
                                {employee.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-sm text-gray-600">Email</p>
                                    <p className="font-bold text-gray-900">{employee.email}</p>
                                </div>
                            </div>
                            {employee.employeeProfile?.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="font-medium text-sm text-gray-600">Phone</p>
                                        <p className="font-bold text-gray-900">
                                            {employee.employeeProfile.phone}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {employee.employeeProfile?.department && (
                                <div className="flex items-center gap-3">
                                    <Briefcase className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="font-medium text-sm text-gray-600">Department</p>
                                        <p className="font-bold text-gray-900">
                                            {employee.employeeProfile.department}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-sm text-gray-600">Joined</p>
                                    <p className="font-bold text-gray-900">
                                        {new Date(employee.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t space-y-2">
                                <Button
                                    className="w-full bg-cyan-600 hover:bg-cyan-700 rounded-xl"
                                    onClick={() => setShowEditDialog(true)}
                                    disabled={
                                        session?.user?.role !== "ADMIN" &&
                                        session?.user?.id !== employee.id
                                    }
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Profile
                                </Button>
                                {session?.user?.role === "ADMIN" && employee.isActive && (
                                    <Button
                                        variant="outline"
                                        className="w-full border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                                        onClick={handleDeactivateEmployee}
                                    >
                                        <UserX className="h-4 w-4 mr-2" />
                                        Deactivate Employee
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <Card className="border-0 shadow-sm rounded-3xl">
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Statistics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Assigned Leads</span>
                                <span className="text-2xl font-bold text-cyan-600">
                                    {employee.assignedLeads?.length || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total Activities</span>
                                <span className="text-2xl font-bold text-blue-600">
                                    {employee.activities?.length || 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Assigned Leads */}
                <div className="col-span-2">
                    <Card className="border-0 shadow-sm rounded-3xl">
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5" />
                                Assigned Leads
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {employee.assignedLeads && employee.assignedLeads.length > 0 ? (
                                <div className="space-y-3">
                                    {employee.assignedLeads.map((assignment: any) => (
                                        <div
                                            key={assignment.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/leads/${assignment.lead.id}`)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold">
                                                    {assignment.lead.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">
                                                        {assignment.lead.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Assigned{" "}
                                                        {new Date(assignment.assignedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        assignment.lead.status === "NEW"
                                                            ? "bg-blue-50 text-blue-700"
                                                            : assignment.lead.status === "IN_PROGRESS"
                                                                ? "bg-yellow-50 text-yellow-700"
                                                                : assignment.lead.status === "CONVERTED"
                                                                    ? "bg-green-50 text-green-700"
                                                                    : "bg-gray-50 text-gray-700"
                                                    }
                                                >
                                                    {assignment.lead.status}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        assignment.lead.temperature === "HOT"
                                                            ? "bg-red-50 text-red-700"
                                                            : assignment.lead.temperature === "WARM"
                                                                ? "bg-orange-50 text-orange-700"
                                                                : "bg-blue-50 text-blue-700"
                                                    }
                                                >
                                                    {assignment.lead.temperature}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                    <UserCheck className="h-12 w-12 mb-2 opacity-20" />
                                    <p className="text-sm italic">No leads assigned</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Edit Employee Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                {/* ... existing dialog content ... */}
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Employee</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateEmployee}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" name="name" defaultValue={employee.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={employee.email}
                                    required
                                />
                            </div>
                            {session?.user?.role === "ADMIN" && (
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role *</Label>
                                    <Select name="role" defaultValue={employee.role}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                            <SelectItem value="MANAGER">Manager</SelectItem>
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={employee.employeeProfile?.phone || ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input
                                    id="department"
                                    name="department"
                                    defaultValue={employee.employeeProfile?.department || ""}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
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
        </div>
    );
}
