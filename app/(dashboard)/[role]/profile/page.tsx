"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useProfile, useUpdateProfile, useUpdatePassword, useStudentProfile, useUpdateStudentProfile } from "@/hooks/use-profile";
import { toast } from "sonner";
import { User, Mail, Phone, Briefcase, Key, Shield, Save, Loader2, Globe, Calendar, MapPin, CreditCard, GraduationCap, History, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import StudentDocumentsSection from "@/components/student/StudentDocumentsSection";
import { FolderOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";

export default function ProfilePage() {
    const { data: session } = useSession();
    const [isSaving, setIsSaving] = useState(false);

    // Profile Queries
    const { data: profileData, isLoading: isBaseLoading } = useProfile();
    const { data: studentData, isLoading: isStudentLoading } = useStudentProfile();

    const updateProfileMutation = useUpdateProfile();
    const updateStudentMutation = useUpdateStudentProfile();
    const updatePasswordMutation = useUpdatePassword();

    // Profile State
    const [profile, setProfile] = useState<any>({
        name: "",
        email: "",
        role: "",
        phone: "",
        department: "",
        // Student specific
        firstName: "",
        lastName: "",
        gender: "",
        nationality: "",
        address: "",
        passportNo: "",
        passportIssueDate: "",
        passportExpiryDate: "",
        dateOfBirth: "",
    });

    // Update local state when data is fetched
    useEffect(() => {
        if (profileData) {
            const baseData = {
                name: profileData.name || "",
                email: profileData.email || "",
                role: profileData.role || "",
                phone: profileData.employeeProfile?.phone || "",
                department: profileData.employeeProfile?.department || "",
            };

            if (profileData.role === "STUDENT" && studentData) {
                const lead = studentData.lead;
                setProfile((prev: any) => ({
                    ...prev,
                    ...baseData,
                    name: studentData.user?.name || prev.name,
                    phone: studentData.phone || prev.phone,
                    firstName: lead?.firstName || prev.firstName,
                    lastName: lead?.lastName || prev.lastName,
                    gender: lead?.gender || prev.gender,
                    nationality: lead?.nationality || prev.nationality,
                    address: lead?.address || prev.address,
                    passportNo: studentData.passportNo || lead?.passportNo || prev.passportNo,
                    passportIssueDate: studentData.passportIssueDate ? new Date(studentData.passportIssueDate).toISOString().split('T')[0] : prev.passportIssueDate,
                    passportExpiryDate: studentData.passportExpiryDate ? new Date(studentData.passportExpiryDate).toISOString().split('T')[0] : prev.passportExpiryDate,
                    dateOfBirth: lead?.dateOfBirth ? new Date(lead.dateOfBirth).toISOString().split('T')[0] : prev.dateOfBirth,
                }));
            } else {
                setProfile((prev: any) => ({ ...prev, ...baseData }));
            }
        }
    }, [profileData, studentData]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (profile.role === "STUDENT") {
                await updateStudentMutation.mutateAsync(profile);
            } else {
                await updateProfileMutation.mutateAsync({
                    name: profile.name,
                    phone: profile.phone,
                    department: profile.department,
                });
            }
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    // Password State
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        setIsSaving(true);
        try {
            await updatePasswordMutation.mutateAsync({
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

    if (isBaseLoading || (profileData?.role === "STUDENT" && isStudentLoading)) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const isStudent = profile.role === "STUDENT";

    return (
        <div className="max-w-5xl mx-auto p-2 sm:p-6 space-y-4 sm:space-y-6 pb-24">
            <div className="flex flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                <div className="space-y-0.5 sm:space-y-1">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">My Profile</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-tight">Manage your settings and account</p>
                </div>
                {isStudent && (
                    <Badge className="bg-primary/10 text-primary border-none font-bold px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-xs text-center shrink-0">
                        ID: {studentData?.id?.split('-')[0].toUpperCase()}
                    </Badge>
                )}
            </div>

            <Tabs defaultValue="details" className="w-full relative flex flex-col items-start min-h-[500px]">
                <div className="w-full sticky top-[64px] sm:top-0 z-20 bg-background pt-2 pb-2">
                    <TabsList className="flex w-full overflow-x-auto scrollbar-hide bg-muted/50 p-1 rounded-2xl justify-start sm:justify-center border border-border/10 shadow-sm relative z-30">
                        <TabsTrigger value="details" className="rounded-xl text-[10px] sm:text-xs font-semibold py-2 px-4 shrink-0 whitespace-nowrap">Personal Details</TabsTrigger>
                        {isStudent && (
                            <TabsTrigger value="academic" className="rounded-xl text-[10px] sm:text-xs font-semibold py-2 px-4 shrink-0 whitespace-nowrap">Academic details & Work</TabsTrigger>
                        )}
                        <TabsTrigger value="security" className="rounded-xl text-[10px] sm:text-xs font-semibold py-2 px-4 shrink-0 whitespace-nowrap">Security Details</TabsTrigger>
                    </TabsList>
                </div>

                {/* Profile Details Tab */}
                <TabsContent value="details" className="mt-4 w-full">
                    <Card className="border border-border rounded-3xl bg-card shadow-sm overflow-hidden">
                        <CardHeader className="pb-6 border-b border-border/50 bg-muted/30">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" /> Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10">
                                {/* Avatar Section */}
                                <div className="flex flex-col items-center gap-2 sm:gap-4">
                                    <div className="h-20 w-20 sm:h-32 sm:w-32 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-2xl sm:text-4xl font-bold border-2 border-primary/20 shadow-inner">
                                        {profile.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-center space-y-1">
                                        <Badge variant="outline" className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest py-0.5 sm:py-1 border-primary/30 text-primary">
                                            {profile.role}
                                        </Badge>
                                        <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">Member since {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        {/* Common Fields */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Full Name</Label>
                                            <div className="relative group">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    value={profile.name ?? ""}
                                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                    className="pl-10 h-11 text-sm rounded-xl border-border/60 bg-muted/20 focus:bg-background transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input value={profile.email ?? ""} disabled className="pl-10 h-11 text-sm rounded-xl bg-muted/40 border-dashed text-muted-foreground cursor-not-allowed" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Phone Number</Label>
                                            <PhoneInput
                                                value={profile.phone ?? ""}
                                                onChange={(val) => setProfile({ ...profile, phone: val })}
                                                className="h-11"
                                            />
                                        </div>

                                        {!isStudent ? (
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Department</Label>
                                                <div className="relative group">
                                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <Input
                                                        value={profile.department ?? ""}
                                                        onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                                                        className="pl-10 h-11 text-sm rounded-xl border-border/60 bg-muted/20 focus:bg-background"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Date of Birth</Label>
                                                    <DatePicker
                                                        value={profile.dateOfBirth ?? ""}
                                                        onChange={(date) => setProfile({ ...profile, dateOfBirth: date })}
                                                        placeholder="Select birth date"
                                                        className="h-11 rounded-xl border-border/60 bg-muted/20 focus:bg-background"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Gender</Label>
                                                    <Select value={profile.gender} onValueChange={(val) => setProfile({ ...profile, gender: val })}>
                                                        <SelectTrigger className="h-11 rounded-xl border-border/60 bg-muted/20">
                                                            <SelectValue placeholder="Select gender" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="MALE">Male</SelectItem>
                                                            <SelectItem value="FEMALE">Female</SelectItem>
                                                            <SelectItem value="OTHER">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Nationality</Label>
                                                    <div className="relative group">
                                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            value={profile.nationality ?? ""}
                                                            onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                                                            className="pl-10 h-11 text-sm rounded-xl bg-muted/20"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {isStudent && (
                                        <>
                                            <Separator className="my-2 opacity-50" />
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Passport No</Label>
                                                    <div className="relative group">
                                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            value={profile.passportNo ?? ""}
                                                            onChange={(e) => setProfile({ ...profile, passportNo: e.target.value })}
                                                            className="pl-10 h-11 text-sm rounded-xl bg-muted/20"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Issue Date</Label>
                                                    <DatePicker
                                                        value={profile.passportIssueDate ?? ""}
                                                        onChange={(date) => setProfile({ ...profile, passportIssueDate: date })}
                                                        placeholder="Select issue date"
                                                        className="h-11 rounded-xl bg-muted/20"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Expiry Date</Label>
                                                    <DatePicker
                                                        value={profile.passportExpiryDate ?? ""}
                                                        onChange={(date) => setProfile({ ...profile, passportExpiryDate: date })}
                                                        placeholder="Select expiry date"
                                                        className="h-11 rounded-xl bg-muted/20"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Address</Label>
                                                <div className="relative group">
                                                    <MapPin className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                                                    <Textarea
                                                        value={profile.address ?? ""}
                                                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                                        className="pl-10 min-h-[100px] text-sm rounded-2xl bg-muted/20 focus:bg-background transition-all resize-none"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="pt-4 flex justify-end">
                                        <Button type="submit" className="bg-primary hover:bg-primary/90 h-11 rounded-xl text-sm px-8 shadow-lg shadow-primary/20" disabled={isSaving}>
                                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Save All Changes
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Academic/Work Tab (Read-only for Students) */}
                {isStudent && (
                    <TabsContent value="academic" className="mt-4 w-full space-y-6">
                        <Card className="border border-border rounded-3xl bg-card shadow-sm">
                            <CardHeader className="pb-4 border-b border-border/50">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-primary" /> Educational History
                                </CardTitle>
                                <CardDescription className="text-xs italic text-amber-600 font-medium">Read-only: Contact support to update academic records.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {!studentData?.lead?.academicDetails?.length ? (
                                    <p className="text-xs text-muted-foreground text-center py-8">No academic records found.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {studentData.lead.academicDetails.map((item: any) => (
                                            <div key={item.id} className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex flex-col md:flex-row justify-between gap-4">
                                                <div>
                                                    <h4 className="text-sm font-bold text-foreground">{item.qualification}</h4>
                                                    <p className="text-xs text-muted-foreground">{item.stream} • {item.institution}</p>
                                                </div>
                                                <div className="flex gap-6 text-right">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Passing Year</p>
                                                        <p className="text-xs font-semibold">{item.passingYear}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Score</p>
                                                        <p className="text-xs font-semibold">{item.percentage}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border border-border rounded-3xl bg-card shadow-sm">
                            <CardHeader className="pb-4 border-b border-border/50">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <History className="h-4 w-4 text-primary" /> Work Experience
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {!studentData?.lead?.workExperience?.length ? (
                                    <p className="text-xs text-muted-foreground text-center py-8">No work experience listed.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {studentData.lead.workExperience.map((item: any) => (
                                            <div key={item.id} className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-sm font-bold text-foreground">{item.position}</h4>
                                                    <Badge variant="outline" className="text-[10px]">{item.totalExperience}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground font-medium">{item.companyName}</p>
                                                <p className="text-[10px] text-muted-foreground mt-1">{item.startDate} — {item.endDate}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* Security Tab */}
                <TabsContent value="security" className="mt-4 w-full">
                    <Card className="border border-border rounded-3xl bg-card shadow-sm">
                        <CardHeader className="pb-4 border-b border-border/50">
                            <CardTitle className="text-sm font-bold">Account Security</CardTitle>
                            <CardDescription className="text-xs">Update your password to keep your account secure</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <form onSubmit={handlePasswordChange} className="space-y-6 max-w-sm">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Password</Label>
                                    <PasswordInput
                                        value={passwords.currentPassword}
                                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                        className="h-11 rounded-xl bg-muted/20"
                                    />
                                </div>
                                <Separator className="my-4 opacity-50" />
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">New Password</Label>
                                        <PasswordInput
                                            value={passwords.newPassword}
                                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Confirm New Password</Label>
                                        <PasswordInput
                                            value={passwords.confirmPassword}
                                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/20"
                                        />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Button type="submit" className="w-full h-11 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-rose-600/20" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                                        Update Account Security
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
