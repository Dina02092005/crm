import { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-sidebar flex">
            {/* Sidebar - persistent across all dashboard pages */}
            <Sidebar />

            {/* Main Content - positioned adjacent to sidebar */}
            <div className="flex-1 flex items-center py-1 md:py-2 overflow-hidden">
                {/* White rounded container - premium floating effect */}
                <div className="bg-background dark:bg-sidebar rounded-3xl px-3 md:px-4 pb-4 pt-0 h-[98vh] w-full overflow-y-auto scrollbar-hide ml-0 mr-1 md:mr-2 border border-border">
                    <DashboardHeader />
                    {children}
                </div>
            </div>
        </div>
    );
}
