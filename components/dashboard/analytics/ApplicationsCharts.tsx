"use client";

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
    PieChart, Pie, Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
    PENDING: "#94a3b8", SUBMITTED: "#3b82f6", UNDER_REVIEW: "#8b5cf6",
    DEFERRED: "#f59e0b", ENROLLED: "#10b981", REJECTED: "#ef4444", DRAFT: "#e2e8f0",
};
const COUNTRY_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#14b8a6", "#6366f1", "#78716c"];

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

interface ApplicationsChartsProps {
    applicationsByStatus: { status: string; count: number }[];
    applicationsByCountry: { country: string; count: number }[];
    applicationsByIntake: { intake: string; count: number }[];
    isLoading: boolean;
}

export function ApplicationsCharts({ applicationsByStatus, applicationsByCountry, applicationsByIntake, isLoading }: ApplicationsChartsProps) {
    if (isLoading) return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="rounded-2xl bg-muted animate-pulse h-64" />)}
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Bar — by status */}
            <Card title="Applications by Status">
                {applicationsByStatus.length === 0 ? <Empty /> : (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={applicationsByStatus} layout="vertical" margin={{ top: 4, right: 16, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                            <YAxis type="category" dataKey="status" tick={{ fontSize: 10 }} width={80} />
                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                {applicationsByStatus.map((r, i) => (
                                    <Cell key={i} fill={STATUS_COLORS[r.status] ?? "#6b7280"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </Card>

            {/* Pie — by country */}
            <Card title="Applications by Country">
                {applicationsByCountry.length === 0 ? <Empty /> : (
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={applicationsByCountry} dataKey="count" nameKey="country"
                                cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                                {applicationsByCountry.map((_, i) => (
                                    <Cell key={i} fill={COUNTRY_COLORS[i % COUNTRY_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                            <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </Card>

            {/* Bar — by intake */}
            <Card title="Applications by Intake">
                {applicationsByIntake.length === 0 ? <Empty /> : (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={applicationsByIntake.slice(0, 10)} margin={{ top: 4, right: 8, left: -20, bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="intake" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
                            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </Card>
        </div>
    );
}
