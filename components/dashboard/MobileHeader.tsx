"use client";

import { Bell, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export function MobileHeader() {
    const { data: session } = useSession();
    const pathname = usePathname();

    const getTitle = () => {
        if (pathname.includes("/dashboard")) return "Dashboard";
        if (pathname.includes("/master/universities")) return "Explore";
        if (pathname.includes("/profile")) return "Settings";
        if (pathname.includes("/applications")) return "Applications";
        return "Portal";
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 z-50 lg:hidden">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {getTitle()}
            </h1>
            <div className="flex items-center gap-3">
                <button className="relative p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                </button>
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                    {session?.user?.imageUrl ? (
                        <img src={session.user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-4 h-4 text-primary" />
                    )}
                </div>
            </div>
        </header>
    );
}
