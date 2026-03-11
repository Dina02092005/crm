"use client";

import { Search } from "lucide-react";

export function SearchBar() {
    return (
        <div className="px-4 pb-4 sticky top-0 bg-white z-10">
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B1D1D] group-focus-within:text-[#4A0E0E] transition-colors" />
                <input
                    type="text"
                    placeholder="What do you want to Study?"
                    className="w-full h-14 pl-14 pr-6 rounded-full border-none bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] text-sm font-medium focus:ring-2 focus:ring-[#4A0E0E]/5 transition-all outline-none placeholder:text-slate-400"
                />
            </div>
        </div>
    );
}
