"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, CheckCircle2 } from "lucide-react";

interface CourseCardProps {
    name: string;
    level: string;
    university: string;
    thumbnail: string;
    universityLogo: string;
}

export function CourseCard({ name, level, university, thumbnail, universityLogo }: CourseCardProps) {
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isComparing, setIsComparing] = useState(false);

    return (
        <div className="flex items-center gap-4 py-4 px-1 group transition-all">
            {/* Thumbnail Circle */}
            <div className="relative h-16 w-16 rounded-full overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50">
                <Image src={thumbnail} alt={name} fill className="object-cover" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-0.5">
                <h4 className="font-bold text-[15px] text-slate-800 leading-snug line-clamp-1">{name}</h4>
                <p className="text-[12px] font-medium text-slate-400">{level}</p>
                <p className="text-[12px] font-medium text-slate-500 line-clamp-1">{university}</p>
                <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Comparing</span>
                    <button
                        onClick={() => setIsComparing(!isComparing)}
                        className={`transition-colors ${isComparing ? 'text-primary' : 'text-slate-200 hover:text-slate-300'}`}
                    >
                        <CheckCircle2 className="h-4.5 w-4.5" />
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center justify-between h-full gap-4">
                <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="p-2 transition-transform active:scale-90"
                >
                    <Heart
                        className={`h-6 w-6 transition-colors ${isWishlisted ? 'fill-[#AD0000] text-[#AD0000]' : 'text-slate-300 hover:text-slate-400'}`}
                    />
                </button>
                <div className="relative h-10 w-10 rounded-full border border-slate-100 shadow-sm bg-white p-1.5 flex items-center justify-center">
                    <Image src={universityLogo} alt={`${university} logo mini`} fill className="object-contain p-2" />
                </div>
            </div>
        </div>
    );
}
