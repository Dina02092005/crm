"use client";

const STAGE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

interface FunnelChartProps {
    funnel: { stage: string; count: number }[];
    isLoading: boolean;
}

export function FunnelChart({ funnel, isLoading }: FunnelChartProps) {
    if (isLoading) return <div className="rounded-2xl bg-muted animate-pulse h-48" />;
    if (!funnel || funnel.length === 0) return null;

    const maxCount = funnel[0]?.count || 1;

    return (
        <div className="rounded-2xl bg-card border border-border/50 p-4">
            <p className="text-sm font-semibold text-foreground/80 mb-4">Student Lifecycle Funnel</p>
            <div className="space-y-2">
                {funnel.map(({ stage, count }, i) => {
                    const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    const dropPct = i > 0 && funnel[i - 1].count > 0
                        ? Math.round(((funnel[i - 1].count - count) / funnel[i - 1].count) * 100)
                        : null;
                    return (
                        <div key={stage} className="space-y-1">
                            {dropPct !== null && (
                                <div className="flex items-center gap-1 pl-2">
                                    <div className="w-px h-3 bg-border ml-4" />
                                    <span className="text-[10px] text-muted-foreground">▼ {dropPct}% drop-off</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-medium text-foreground/60 w-24 shrink-0 text-right">{stage}</span>
                                <div className="flex-1 relative h-8 rounded-lg overflow-hidden bg-muted/40">
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                                        style={{
                                            width: `${pct}%`,
                                            background: STAGE_COLORS[i],
                                            opacity: 0.85,
                                        }}
                                    />
                                    <span className="absolute inset-0 flex items-center px-3 text-[11px] font-bold text-white mix-blend-plus-lighter">
                                        {count.toLocaleString()}
                                    </span>
                                </div>
                                <span className="text-[11px] font-semibold w-12 text-right text-muted-foreground">
                                    {Math.round(pct)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
