"use client";

import { useSession } from "next-auth/react";
import { useStudentProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import StudentDocumentsSection from "@/components/student/StudentDocumentsSection";

export default function DocumentsPage() {
    const { data: session } = useSession();
    const { data: studentData, isLoading } = useStudentProfile();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!studentData?.id) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground p-4">
                <p>You need to complete your profile before managing documents.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 pb-24 relative z-0">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Documents</h1>
                <p className="text-sm text-muted-foreground">Manage and upload your application documents</p>
            </div>

            <Card className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden min-h-[500px]">
                <CardHeader className="pb-4 border-b border-border/50 bg-slate-50/20">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" /> Document Vault
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Securely upload and manage your application documents</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 px-4 md:px-6">
                    <StudentDocumentsSection studentId={studentData.id} />
                </CardContent>
            </Card>
        </div>
    );
}
