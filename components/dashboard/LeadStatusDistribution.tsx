"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusCount {
    status: string;
    _count: {
        status: number;
    };
}

interface LeadStatusDistributionProps {
    data: StatusCount[];
    isLoading: boolean;
}

const COLORS = [
    '#0d9488', // Teal
    '#2563eb', // Blue
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#64748b'  // Slate
];

const STATUS_LABELS: Record<string, string> = {
    NEW: "New",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In Progress",
    FOLLOW_UP: "Follow Up",
    CONVERTED: "Converted",
    LOST: "Lost"
};

export function LeadStatusDistribution({ data, isLoading }: LeadStatusDistributionProps) {
    const chartData = useMemo(() => {
        if (!data) return [];
        return data.map(item => ({
            name: STATUS_LABELS[item.status] || item.status,
            value: item._count.status
        })).filter(item => item.value > 0);
    }, [data]);

    if (isLoading) {
        return (
            <Card className="rounded-xl border-border shadow-none h-full">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Pipeline Status</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <Skeleton className="w-[200px] h-[200px] rounded-full" />
                </CardContent>
            </Card>
        );
    }

    if (chartData.length === 0) {
        return (
            <Card className="rounded-xl border-border shadow-none h-full">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Pipeline Status</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                    No data available
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-xl border-border shadow-none h-full flex flex-col">
            <CardHeader className="pb-0">
                <CardTitle className="text-lg font-medium">Pipeline Status</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: '8px',
                                border: '1px solid hsl(var(--border))',
                                boxShadow: 'none',
                                fontSize: '12px',
                                backgroundColor: 'hsl(var(--card))',
                                color: 'hsl(var(--foreground))'
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '12px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
