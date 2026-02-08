"use client";

import { FaSearch, FaPlus } from "react-icons/fa";
import { Bell } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useSession } from "next-auth/react";

interface DashboardHeaderProps {
    title?: string;
    description?: string;
    action?: React.ReactNode;
}

import { usePathname } from "next/navigation";

export function DashboardHeader({ title, description, action }: DashboardHeaderProps) {
    const { data: session } = useSession() as any;
    const pathname = usePathname();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const getTitle = () => {
        if (title) return title;
        if (pathname.includes("/leads")) return "Lead Management";
        if (pathname.includes("/employees")) return "Employees";
        if (pathname.includes("/customers")) return "Customers";
        if (pathname.includes("/drivers-list")) return "Drivers";
        if (pathname.includes("/roles")) return "Roles";
        return `${getGreeting()}, ${session?.user?.name || 'User'}`;
    };

    return (
        <header className="flex items-center justify-between px-2 py-4 mb-6 border-b border-gray-200 sticky top-0 z-50 bg-white">
            {/* Greeting */}
            <div className="min-w-[180px]">
                <h2 className="font-bold text-[18px] leading-none tracking-normal font-sans text-foreground">
                    {getTitle()}
                </h2>
                {description && (
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
            </div>

            {/* Centered Search - Removed as per user request */}
            <div className="mx-auto w-[456px]">
                {/* Search bar removed */}
            </div>

            {/* Right side: Actions, Notifications, Profile */}
            <div className="flex items-center gap-4 justify-end">
                {/* Custom Action (replaces hardcoded button) */}
                {action}

                {/* Notifications */}
                <button className="p-2.5 rounded-lg hover:bg-accent transition-all relative">
                    <Bell className="w-5 h-5 text-[#484848]" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
                </button>

                {/* User Avatar Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-10 h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-ring transition-all outline-none">
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                                <span className="font-semibold text-sm">
                                    {session?.user?.name?.charAt(0) || "U"}
                                </span>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="cursor-pointer w-full">Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => signOut({ callbackUrl: '/login' })}
                        >
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
