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
} from "react-icons/fa";

export interface MenuItem {
    label: string;
    icon: React.ReactNode;
    href?: string;
    submenu?: { label: string; href: string }[];
    roles?: string[];
    isFileManager?: boolean;
}

export const menuItems: MenuItem[] = [
    { label: "Dashboard", icon: <FaTachometerAlt />, href: "/dashboard" },
    { label: "My Notes", icon: <FaStickyNote />, href: "/notes" },
    { label: "Leads", icon: <FaHeadset />, href: "/leads", roles: ["ADMIN", "MANAGER", "AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT"] },
    { label: "Students", icon: <FaUsers />, href: "/students", roles: ["ADMIN", "MANAGER", "AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT"] },
    { label: "Applications", icon: <FaFolderOpen />, href: "/applications", roles: ["ADMIN", "MANAGER", "AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT", "STUDENT"] },
    { label: "Visa Applications", icon: <FaSitemap />, href: "/visa-applications", roles: ["ADMIN", "MANAGER", "AGENT", "COUNSELOR", "STUDENT"] },
    {
        label: "Defer / Enrolled",
        icon: <FaSync />,
        roles: ["ADMIN", "MANAGER", "AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT"],
        submenu: [
            { label: "Defer Student", href: "/applications?status=DEFERRED" },
            { label: "Enrolled", href: "/applications?status=ENROLLED" },
        ]
    },
    { label: "My Profile", icon: <FaUserCog />, href: "/profile", roles: ["STUDENT"] },
    { label: "My Documents", icon: <FaFolderOpen />, href: "/profile?tab=documents", roles: ["STUDENT"] },
    { label: "Course Finder", icon: <FaSitemap />, href: "/master/universities", roles: ["STUDENT"] },
    { label: "Agents", icon: <FaHeadset />, href: "/agents", roles: ["ADMIN"] },
    { label: "Counselors", icon: <FaUserCog />, href: "/employees", roles: ["ADMIN", "AGENT"] },
    {
        label: "File Manager",
        icon: <FaFolderOpen />,
        href: "/file-manager",
        roles: ["ADMIN", "MANAGER"],
    },
    {
        label: "Master",
        icon: <FaSitemap />,
        roles: ["ADMIN"],
        submenu: [
            { label: "Checklist", href: "/master/checklist" },
            { label: "Countries", href: "/master/countries" },
            { label: "Universities", href: "/master/universities" },
            { label: "Qualifications", href: "/master/qualifications" },
            { label: "Courses", href: "/master/courses" },
            { label: "Roles & Permissions", href: "/master/roles" },
            { label: "Websites", href: "/master/websites" },
        ]
    },
];
