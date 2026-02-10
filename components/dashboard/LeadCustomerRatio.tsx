"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LeadCustomerRatioProps {
    totalLeads: number;
    totalCustomers: number;
    isLoading: boolean;
}

export function LeadCustomerRatio({ totalLeads, totalCustomers, isLoading }: LeadCustomerRatioProps) {
    if (isLoading) {
        return (
            <Card className="rounded-xl border-border shadow-none">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse h-20 bg-muted rounded"></div>
                </CardContent>
            </Card>
        );
    }

    const ratio = totalLeads > 0 ? (totalCustomers / totalLeads) * 100 : 0;

    return (
        <Card className="rounded-xl border-border shadow-none h-full flex flex-col justify-center">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <div className="text-3xl font-bold">{ratio.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Leads converted to Customers</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <span className="flex items-center gap-1"><UserCheck className="w-4 h-4 text-teal-600" /> {totalCustomers}</span>
                        <span>/</span>
                        <span className="flex items-center gap-1"><Users className="w-4 h-4 text-primary" /> {totalLeads}</span>
                    </div>
                </div>
                <Progress value={ratio} className="h-2" indicatorClassName="bg-teal-600" />
            </CardContent>
        </Card>
    );
}
