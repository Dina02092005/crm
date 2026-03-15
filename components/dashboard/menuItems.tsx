import {
    FaTachometerAlt,
    FaHeadset,
    FaUsers,
    FaUserCog,
    FaSitemap,
    FaFolderOpen,
    FaCheckCircle,
    FaClock,
    FaSync,
    FaStickyNote,
    FaSignal,
    FaPhone,
} from "react-icons/fa";

import { PermissionModule, PermissionAction } from "@/lib/permissions";

export interface MenuItem {
    label: string;
    icon: React.ReactNode;
    href?: string;
    submenu?: { label: string; href: string; permission?: { action: PermissionAction; module: PermissionModule } }[];
    roles?: string[];
    permission?: { action: PermissionAction; module: PermissionModule };
    isFileManager?: boolean;
}

export const menuItems: MenuItem[] = [
    { label: "Dashboard", icon: <FaTachometerAlt />, href: "/dashboard" },
    // { label: "My Notes", icon: <FaStickyNote />, href: "/notes", permission: { action: "VIEW", module: "NOTES" } },
    { label: "Call Center", icon: <FaPhone />, href: "/call-center", roles: ["AGENT", "COUNSELOR"] },
    { label: "Leads", icon: <FaHeadset />, href: "/leads", roles: ["ADMIN", "MANAGER", "AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT"], permission: { action: "VIEW", module: "LEADS" } },
    { label: "Students", icon: <FaUsers />, href: "/students", roles: ["ADMIN", "MANAGER", "AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT"], permission: { action: "VIEW", module: "STUDENTS" } },
    { label: "Applications", icon: <FaFolderOpen />, href: "/applications", roles: ["ADMIN", "MANAGER", "AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT", "STUDENT"], permission: { action: "VIEW", module: "APPLICATIONS" } },
    { label: "Visa Applications", icon: <FaSitemap />, href: "/visa-applications", roles: ["ADMIN", "MANAGER", "AGENT", "COUNSELOR", "STUDENT"], permission: { action: "VIEW", module: "VISA" } },
    {
        label: "Defer / Enrolled",
        icon: <FaSync />,
        roles: ["ADMIN", "MANAGER", "AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT"],
        permission: { action: "VIEW", module: "APPLICATIONS" },
        submenu: [
            { label: "Defer Student", href: "/applications?status=DEFERRED", permission: { action: "VIEW", module: "APPLICATIONS" } },
            { label: "Enrolled", href: "/applications?status=ENROLLED", permission: { action: "VIEW", module: "APPLICATIONS" } },
        ]
    },
    {
        label: "Course Finder", 
        icon: <FaSitemap />, 
        href: "/search-programs", 
        roles: ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "AGENT", "STUDENT"]
    },
    {
        label: "University List", 
        icon: <FaSitemap />, 
        href: "/master/universities", 
        roles: ["STUDENT", "AGENT", "COUNSELOR", "SUPER_ADMIN", "ADMIN"]
    },
    {
        label: "File Manager",
        icon: <FaFolderOpen />,
        href: "/file-manager",
        roles: ["ADMIN", "MANAGER"],
        permission: { action: "VIEW", module: "FILE_MANAGER" }
    },
    {
        label: "Master",
        icon: <FaSitemap />,
        roles: ["ADMIN"],
        permission: { action: "VIEW", module: "MASTER" },
        submenu: [
            { label: "Checklist", href: "/master/checklist", permission: { action: "VIEW", module: "MASTER" } },
            { label: "Countries", href: "/master/countries", permission: { action: "VIEW", module: "MASTER" } },
            { label: "Universities", href: "/master/universities", permission: { action: "VIEW", module: "MASTER" } },
            { label: "Qualifications", href: "/master/qualifications", permission: { action: "VIEW", module: "MASTER" } },
            { label: "Courses", href: "/master/courses", permission: { action: "VIEW", module: "MASTER" } },
            { label: "Websites", href: "/master/websites", permission: { action: "VIEW", module: "MASTER" } },
        ]
    },
    { label: "My Profile", icon: <FaUserCog />, href: "/profile", roles: ["STUDENT"] },
    { label: "My Documents", icon: <FaFolderOpen />, href: "/profile?tab=documents", roles: ["STUDENT"] },
    {
        label: "Agents",
        icon: <FaHeadset />,
        roles: ["ADMIN"], permission: { action: "VIEW", module: "AGENTS" },
        submenu: [
            { label: "Manage Agents", href: "/agents" },
            { label: "Registration Requests", href: "/agents/requests" },
        ]
    },
    { label: "Counselors", icon: <FaUserCog />, href: "/employees", roles: ["ADMIN", "AGENT"], permission: { action: "VIEW", module: "COUNSELORS" } },
    { label: "Reports", icon: <FaSignal />, href: "/reports", roles: ["ADMIN", "MANAGER", "SUPER_ADMIN"], permission: { action: "VIEW", module: "REPORTS" } },
    {
        label: "Roles & Permissions",
        icon: <FaUserCog />,
        href: "/roles",
        roles: ["ADMIN"],
        permission: { action: "VIEW", module: "ROLES" }
    },
];
