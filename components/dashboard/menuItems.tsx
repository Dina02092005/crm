import {
    FaTachometerAlt,
    FaHeadset,
    FaUsers,
    FaUserCog,
    FaSitemap,
    FaFolderOpen,
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
    { label: "Leads", icon: <FaHeadset />, href: "/leads" },
    { label: "Students", icon: <FaUsers />, href: "/students" },
    { label: "My Profile", icon: <FaUserCog />, href: "/profile", roles: ["STUDENT"] },
    { label: "My Documents", icon: <FaSitemap />, href: "/profile?tab=documents", roles: ["STUDENT"] },
    { label: "Agents", icon: <FaHeadset />, href: "/agents", roles: ["ADMIN"] },
    { label: "Counselors", icon: <FaUserCog />, href: "/employees", roles: ["ADMIN", "AGENT"] },
    {
        label: "File Manager",
        icon: <FaFolderOpen />,
        isFileManager: true,
        roles: ["ADMIN", "MANAGER"],
    },
    {
        label: "Master",
        icon: <FaSitemap />,
        roles: ["ADMIN"],
        submenu: [
            { label: "Websites", href: "/master/websites" },
            { label: "Qualifications", href: "/master/qualifications" },
            { label: "Countries", href: "/master/countries" },
            { label: "Application Checklist", href: "/master/checklist" },
        ]
    },
];
