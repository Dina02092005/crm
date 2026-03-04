"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Briefcase,
    GraduationCap,
    FileText,
    User
} from "lucide-react";
import { useRolePath } from "@/hooks/use-role-path";

export function MobileBottomNav() {
    const pathname = usePathname();
    const { prefixPath } = useRolePath();

    const navItems = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: prefixPath("/dashboard"),
        },
        {
            label: "Applications",
            icon: Briefcase,
            href: prefixPath("/master/universities"), // Using universities as search/applications entry for now
        },
        {
            label: "Visa",
            icon: GraduationCap,
            href: prefixPath("/visa"),
        },
        {
            label: "Documents",
            icon: FileText,
            href: prefixPath("/documents"),
        },
        {
            label: "Profile",
            icon: User,
            href: prefixPath("/profile"),
        },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 min-h-[72px] pb-[env(safe-area-inset-bottom,20px)] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-2xl shadow-[0_-8px_20px_rgba(0,0,0,0.08)] z-[60] lg:hidden flex items-center justify-around px-2 pt-2">
            {navItems.map((item) => {
                const isActive = pathname === item.href || (item.label === "Dashboard" && pathname.endsWith("/dashboard"));
                const Icon = item.icon;

                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-colors ${isActive
                            ? "text-primary font-bold"
                            : "text-slate-400 dark:text-slate-500 font-medium"
                            }`}
                    >
                        <Icon className={`w-5 h-5 ${isActive ? "animate-in zoom-in-75 duration-300" : ""}`} />
                        <span className="text-[10px] tracking-tight">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
