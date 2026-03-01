"use client";

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
    PieChart, Pie, Legend,
} from "recharts";

const VISA_STATUS_COLORS: Record<string, string> = {
    PENDING: "#94a3b8", APPROVED: "#10b981", REJECTED: "#ef4444",
    PROCESSING: "#f59e0b", WITHDRAWN: "#6b7280",
};
const COUNTRY_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316", "#14b8a6", "#6366f1", "#78716c", "#84cc16"];

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

interface VisaChartsProps {
    visaByCountry: { country: string; count: number }[];
    visaByStatus: { status: string; count: number }[];
    isLoading: boolean;
}

export function VisaCharts({ visaByCountry, visaByStatus, isLoading }: VisaChartsProps) {
    if (isLoading) return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map(i => <div key={i} className="rounded-2xl bg-muted animate-pulse h-64" />)}
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar — by country */}
            <Card title="Visa Applications by Country">
                {visaByCountry.length === 0 ? <Empty /> : (
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={visaByCountry.slice(0, 10)} margin={{ top: 4, right: 8, left: -20, bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="country" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
                            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                {visaByCountry.slice(0, 10).map((_, i) => (
                                    <Cell key={i} fill={COUNTRY_COLORS[i % COUNTRY_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </Card>

            {/* Pie — by status */}
            <Card title="Visa Status Distribution">
                {visaByStatus.length === 0 ? <Empty /> : (
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie data={visaByStatus} dataKey="count" nameKey="status"
                                cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                                {visaByStatus.map((r, i) => (
                                    <Cell key={i} fill={VISA_STATUS_COLORS[r.status] ?? "#6b7280"} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </Card>
        </div>
    );
}
