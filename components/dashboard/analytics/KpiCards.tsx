"use client";

import { TrendingUp, Users, FileText, Plane, GraduationCap, Target, ArrowUpRight } from "lucide-react";

interface KpiCardsProps {
    kpis: {
        totalLeads: number;
        newLeadsToday: number;
        totalStudents: number;
        totalApplications: number;
        submittedApps: number;
        deferredApps: number;
        enrolledApps: number;
        totalVisa: number;
        approvedVisa: number;
        enrolledStudents: number;
        conversionRate: number;
        visaSuccessRate: number;
        enrollmentRate: number;
        avgVisaProcessingDays: number;
    };
    isLoading: boolean;
}

const CARDS = [
    {
        key: "totalLeads",
        label: "Total Leads",
        sub: (k: any) => `+${k?.newLeadsToday ?? 0} today`,
        icon: TrendingUp,
        gradient: "from-blue-600 to-blue-400",
        light: "bg-blue-50 dark:bg-blue-950/40 text-blue-600",
    },
    {
        key: "totalStudents",
        label: "Total Students",
        sub: (k: any) => `${k?.conversionRate ?? 0}% conversion`,
        icon: Users,
        gradient: "from-teal-600 to-emerald-400",
        light: "bg-teal-50 dark:bg-teal-950/40 text-teal-600",
    },
    {
        key: "conversionRate",
        label: "Conversion Rate",
        format: (v: number) => `${v}%`,
        sub: () => "Leads → Students",
        icon: Target,
        gradient: "from-violet-600 to-purple-400",
        light: "bg-violet-50 dark:bg-violet-950/40 text-violet-600",
    },
    {
        key: "totalApplications",
        label: "Applications",
        sub: (k: any) => `${k?.enrolledApps ?? 0} enrolled`,
        icon: FileText,
        gradient: "from-amber-500 to-yellow-400",
        light: "bg-amber-50 dark:bg-amber-950/40 text-amber-600",
    },
    {
        key: "visaSuccessRate",
        label: "Visa Success",
        format: (v: number) => `${v}%`,
        sub: (k: any) => `${k?.approvedVisa ?? 0}/${k?.totalVisa ?? 0} approved`,
        icon: Plane,
        gradient: "from-sky-500 to-cyan-400",
        light: "bg-sky-50 dark:bg-sky-950/40 text-sky-600",
    },
    {
        key: "enrollmentRate",
        label: "Enrollment Rate",
        format: (v: number) => `${v}%`,
        sub: (k: any) => `${k?.enrolledStudents ?? 0} enrolled`,
        icon: GraduationCap,
        gradient: "from-rose-500 to-pink-400",
        light: "bg-rose-50 dark:bg-rose-950/40 text-rose-600",
    },
    {
        key: "avgVisaProcessingDays",
        label: "Avg Visa Days",
        format: (v: number) => `${v}d`,
        sub: () => "Application → Decision",
        icon: ArrowUpRight,
        gradient: "from-orange-500 to-amber-400",
        light: "bg-orange-50 dark:bg-orange-950/40 text-orange-600",
    },
];

function Skeleton() {
    return <div className="animate-pulse h-8 w-20 bg-muted rounded-lg" />;
}

export function KpiCards({ kpis, isLoading }: KpiCardsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {CARDS.map(({ key, label, sub, format, icon: Icon, gradient, light }) => {
                const raw = kpis?.[key as keyof typeof kpis] ?? 0;
                const value = format ? format(raw as number) : String(raw);
                return (
                    <div
                        key={key}
                        className="relative rounded-2xl bg-card border border-border/50 p-4 overflow-hidden group hover:shadow-md transition-shadow"
                    >
                        {/* gradient stripe top */}
                        <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${gradient} rounded-t-2xl`} />
                        <div className={`w-8 h-8 rounded-xl ${light} flex items-center justify-center mb-3`}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                            {isLoading ? (
                                <Skeleton />
                            ) : (
                                <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
                            )}
                            <p className="text-[11px] font-semibold text-foreground/70">{label}</p>
                            {kpis && (
                                <p className="text-[10px] text-muted-foreground">{sub(kpis)}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
