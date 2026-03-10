"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, MapPin, Clock } from "lucide-react";

export default function VisaPage() {
    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 pb-24 relative z-0">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Visa Tracking</h1>
                <p className="text-sm text-muted-foreground">Monitor and manage your visa applications</p>
            </div>

            <Card className="border border-border rounded-2xl bg-card shadow-sm min-h-[500px]">
                <CardHeader className="pb-4 border-b border-border/50 bg-slate-50/20">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" /> Visa Status
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">View details about your current visa application status</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 px-4 md:px-6 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center">
                        <GraduationCap className="h-12 w-12 text-slate-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">No active visa applications</h3>
                        <p className="text-sm text-slate-500 mt-2 max-w-sm">
                            Once your application is confirmed by the university, your visa application tracking will appear here.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
