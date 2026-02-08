import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-[#001a14] flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content - positioned adjacent to sidebar */}
            <div className="flex-1 flex items-center py-4">
                {/* White rounded container - premium floating effect */}
                <div className="bg-white rounded-3xl p-6 h-[95vh] w-full overflow-y-auto scrollbar-hide ml-0 mr-5">
                    <DashboardHeader />
                    {children}
                </div>
            </div>
        </div>
    );
}
