"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";

interface UniversityCardProps {
    name: string;
    location: string;
    description: string;
    bannerImage: string;
    logoImage: string;
    appliedCount: number;
}

export function UniversityCard({ name, location, description, bannerImage, logoImage, appliedCount }: UniversityCardProps) {
    return (
        <div className="min-w-[300px] w-[300px] md:w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden border border-slate-50 flex-shrink-0 snap-center group">
            {/* Banner */}
            <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                <Image
                    src={bannerImage}
                    alt={name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
            </div>

            {/* Content Area */}
            <div className="p-5 pt-7 relative">
                {/* Overlapping Logo */}
                <div className="absolute -top-7 left-5 h-14 w-14 rounded-2xl bg-white p-2 shadow-md flex items-center justify-center border border-slate-50">
                    <div className="relative h-full w-full">
                        <Image src={logoImage} alt={`${name} logo`} fill className="object-contain" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{name}</h3>
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="h-3 w-3" />
                        <span className="text-[11px] font-medium tracking-wide uppercase">{location}</span>
                    </div>

                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-normal">
                        {description}
                    </p>

                    <div className="pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Avatar Pile */}
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className={`h-6 w-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold ${i === 3 ? 'bg-[#5B63B1] text-white' : 'bg-[#E25A2D] text-white'}`}>
                                        {i === 1 ? 'N' : i === 2 ? 'M' : 'S'}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[11px] font-bold text-[#006837] whitespace-nowrap">
                                {appliedCount} users applied here!
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
