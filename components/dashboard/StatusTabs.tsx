import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StatusTab {
    id: string;
    label: ReactNode;
    color: string;
    bg: string;
}

interface StatusTabsProps {
    tabs: StatusTab[];
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}

export function StatusTabs({ tabs, activeTab, onTabChange, className }: StatusTabsProps) {
    return (
        <div className={cn("flex flex-wrap gap-2 mb-6", className)}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                // Extract base color name for ring styling (e.g., "text-amber-600" -> "amber-600")
                const colorBase = tab.color.replace('text-', '');
                
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all border text-[10px] font-extrabold uppercase tracking-widest",
                            isActive
                                ? `${tab.bg} ${tab.color} border-transparent shadow-sm ring-1 ring-inset ring-${colorBase}/30`
                                : "bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-white/10"
                        )}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
