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
            <div className="flex-1 flex items-center py-2 md:py-4 overflow-hidden">
                {/* White rounded container - premium floating effect */}
                <div className="bg-background dark:bg-sidebar rounded-3xl px-4 md:px-6 pb-6 pt-0 h-[95vh] w-full overflow-y-auto scrollbar-hide ml-0 mr-2 md:mr-4 border border-border">
                    <DashboardHeader />
                    {children}
                </div>
            </div>
        </div>
    );
}
