import {
    FaTachometerAlt,
    FaHeadset,
    FaUsers,
    FaUserCog,
    FaSitemap,
} from "react-icons/fa";

export interface MenuItem {
    label: string;
    icon: React.ReactNode;
    href?: string;
    submenu?: { label: string; href: string }[];
    roles?: string[];
}

export const menuItems: MenuItem[] = [
    { label: "Dashboard", icon: <FaTachometerAlt />, href: "/dashboard" },
    { label: "Leads", icon: <FaHeadset />, href: "/leads" },
    { label: "Customers", icon: <FaUsers />, href: "/customers" },
    { label: "Employees", icon: <FaUserCog />, href: "/employees", roles: ["ADMIN"] },
    {
        label: "Master",
        icon: <FaSitemap />,
        roles: ["ADMIN"],
        submenu: [
            { label: "Websites", href: "/master/websites" },
        ]
    },
];
