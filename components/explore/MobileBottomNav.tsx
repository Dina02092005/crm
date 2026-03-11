"use client";

import { Search, Heart, Users, FolderOpen, Map } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileBottomNav() {
    const pathname = usePathname();

    const tabs = [
        { label: "Explore", icon: Search, href: "#" }, // In actual app, use proper routes
        { label: "Shortlist", icon: Heart, href: "#" },
        { label: "Community", icon: Users, href: "#" },
        { label: "Applications", icon: FolderOpen, href: "#" },
        { label: "Journey", icon: Map, href: "#" },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] px-4 min-h-[72px] pb-[env(safe-area-inset-bottom,20px)] pt-2 flex items-center justify-between z-50 rounded-t-[32px]">
            {tabs.map((tab, idx) => {
                const isActive = tab.label === "Explore"; // Defaulting for demo
                return (
                    <Link
                        key={idx}
                        href={tab.href}
                        className="flex flex-col items-center gap-1 py-1 group"
                    >
                        <tab.icon className={`h-6 w-6 transition-colors ${isActive ? 'text-[#4A0E0E]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span className={`text-[10px] font-bold tracking-tight transition-colors ${isActive ? 'text-[#4A0E0E]' : 'text-slate-400 group-hover:text-slate-600'}`}>
                            {tab.label}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
