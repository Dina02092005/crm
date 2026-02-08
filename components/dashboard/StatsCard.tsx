import { ReactNode } from "react";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    iconBgColor?: string;
}

export function StatsCard({
    title,
    value,
    icon,
    iconBgColor = "bg-primary/10",
}: StatsCardProps) {
    return (
        <div className="flex items-center justify-between p-5 bg-card shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl hover:shadow-md transition-shadow border border-border/50">
            <div className="flex flex-col">
                <p className="text-3xl font-bold text-foreground leading-none mb-2">{value}</p>
                <p className="text-xs text-muted-foreground font-medium">{title}</p>
            </div>
            <div className={`w-10 h-10 ${iconBgColor} rounded-full flex items-center justify-center shrink-0`}>
                {icon}
            </div>
        </div>
    );
}
