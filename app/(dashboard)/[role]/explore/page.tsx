"use client";

import { use, Suspense } from "react";
import { ExplorePageContent } from "@/components/explore/ExplorePageContent";

export default function ExplorePage({ params }: { params: Promise<{ role: string }> }) {
    const { role } = use(params);

    return (
        <Suspense fallback={<div className="p-10 animate-pulse bg-slate-50 min-h-screen rounded-3xl" />}>
            <ExplorePageContent />
        </Suspense>
    );
}
