"use client";

import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, Legend,
    BarChart, Bar,
} from "recharts";

const SOURCE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];
const TEMP_COLORS: Record<string, string> = { HOT: "#ef4444", WARM: "#f59e0b", COLD: "#3b82f6" };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-card border border-border/50 p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground/80">{title}</p>
            {children}
        </div>
    );
}

function Empty() {
    return <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">No data</div>;
}

interface LeadsChartsProps {
    leadsOverTime: { date: string; count: number }[];
    leadsBySource: { source: string; count: number }[];
    leadsByTemperature: { temperature: string; count: number }[];
    isLoading: boolean;
}

export function LeadsCharts({ leadsOverTime, leadsBySource, leadsByTemperature, isLoading }: LeadsChartsProps) {
    if (isLoading) return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="rounded-2xl bg-muted animate-pulse h-64" />)}
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Line — over time */}
            <div className="lg:col-span-2">
                <Card title="Leads Over Time">
                    {leadsOverTime.length === 0 ? <Empty /> : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={leadsOverTime} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                                    labelFormatter={l => `Date: ${l}`}
                                />
                                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5}
                                    dot={false} activeDot={{ r: 4 }} name="Leads" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </Card>
            </div>

            {/* Donut — by source */}
            <Card title="Leads by Source">
                {leadsBySource.length === 0 ? <Empty /> : (
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={leadsBySource} dataKey="count" nameKey="source"
                                cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={2}>
                                {leadsBySource.map((_, i) => (
                                    <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </Card>

            {/* Bar — by temperature */}
            <div className="lg:col-span-3">
                <Card title="Leads by Temperature">
                    {leadsByTemperature.length === 0 ? <Empty /> : (
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={leadsByTemperature} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="temperature" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {leadsByTemperature.map((r, i) => (
                                        <Cell key={i} fill={TEMP_COLORS[r.temperature] ?? "#6b7280"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Card>
            </div>
        </div>
    );
}
