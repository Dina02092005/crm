"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from 'react';

interface AnalyticsData {
    date: string;
    leads: number;
    customers: number;
}

interface LeadAnalyticsGraphProps {
    data: AnalyticsData[];
    isLoading: boolean;
}

export function LeadAnalyticsGraph({ data, isLoading }: LeadAnalyticsGraphProps) {
    const formattedData = useMemo(() => {
        return data.map(item => ({
            ...item,
            formattedDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
    }, [data]);

    if (isLoading) {
        return (
            <Card className="rounded-xl border-border shadow-none">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Lead Generation Overview</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="text-muted-foreground">Loading chart...</div>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className="rounded-xl border-border shadow-none">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Lead Generation Overview</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="text-muted-foreground">No data available</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-xl border-border shadow-none">
            <CardHeader>
                <CardTitle className="text-lg font-medium">Lead Generation Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={formattedData}
                            margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                            <XAxis
                                dataKey="formattedDate"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                className="text-xs text-muted-foreground"
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                className="text-xs text-muted-foreground"
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="leads"
                                stroke="hsl(var(--primary))"
                                fillOpacity={1}
                                fill="url(#colorLeads)"
                                name="Leads"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="customers"
                                stroke="hsl(142.1 76.2% 36.3%)"
                                fillOpacity={1}
                                fill="url(#colorCustomers)"
                                name="Customers"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
