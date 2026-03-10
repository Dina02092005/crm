"use client";

import { Gift, UserCircle } from "lucide-react";

export function ExploreHeader() {
    return (
        <div className="flex items-center justify-between px-4 py-6 bg-white shrink-0">
            <h1 className="text-3xl font-extrabold text-[#4A0E0E] tracking-tight">Explore</h1>
            <div className="flex items-center gap-4">
                <button className="p-1 hover:bg-slate-50 transition-colors">
                    <Gift className="h-7 w-7 text-[#AD0000]" />
                </button>
                <button className="p-0.5 rounded-full border border-slate-200">
                    <UserCircle className="h-8 w-8 text-slate-400" />
                </button>
            </div>
        </div>
    );
}
