"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { User, Mail, Phone, Briefcase, Key, Shield, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Profile State
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        role: "",
        phone: "",
        department: "",
    });

    // Password State
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get("/api/profile");
            const data = response.data;
            setProfile({
                name: data.name || "",
                email: data.email || "",
                role: data.role || "",
                phone: data.employeeProfile?.phone || "",
                department: data.employeeProfile?.department || "",
            });
        } catch (error) {
            toast.error("Failed to load profile");
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await axios.patch("/api/profile", {
                name: profile.name,
                phone: profile.phone,
                department: profile.department,
            });
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        setIsSaving(true);
        try {
            await axios.post("/api/profile/password", {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            toast.success("Password changed successfully");
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to change password");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="details">Account Details</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                {/* Account Details Tab */}
                <TabsContent value="details" className="mt-6">
                    <Card className="border-0">
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your personal details here.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Avatar Placeholder */}
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-24 w-24 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 text-3xl font-bold border-2 border-teal-100">
                                            {profile.name.charAt(0).toUpperCase()}
                                        </div>
                                        <Badge variant="outline" className="capitalize">
                                            {profile.role.toLowerCase()}
                                        </Badge>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="flex-1 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Full Name</Label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="name"
                                                        value={profile.name}
                                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                        className="pl-9"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email Address</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="email"
                                                        value={profile.email}
                                                        disabled
                                                        className="pl-9 bg-gray-50"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="phone"
                                                        value={profile.phone}
                                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                        className="pl-9"
                                                        placeholder="+1 234 567 890"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="department">Department</Label>
                                                <div className="relative">
                                                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="department"
                                                        value={profile.department}
                                                        onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                                                        className="pl-9"
                                                        placeholder="Sales, Marketing, etc."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isSaving}>
                                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="mt-6">
                    <Card className="border-0">
                        <CardHeader>
                            <CardTitle>Password & Security</CardTitle>
                            <CardDescription>Manage your password and security settings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                                <div className="space-y-2">
                                    <Label htmlFor="current">Current Password</Label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="current"
                                            type="password"
                                            value={passwords.currentPassword}
                                            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <Separator className="my-2" />
                                <div className="space-y-2">
                                    <Label htmlFor="new">New Password</Label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="new"
                                            type="password"
                                            value={passwords.newPassword}
                                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm">Confirm New Password</Label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="confirm"
                                            type="password"
                                            value={passwords.confirmPassword}
                                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button type="submit" variant="destructive" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Change Password
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
