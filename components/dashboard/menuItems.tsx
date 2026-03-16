import { PermissionModule, PermissionAction } from "@/lib/permissions";

const Icons = {
    Dashboard: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
    CallCenter: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.96a16 16 0 0 0 6.01 6.01l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    ),
    Leads: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    ),
    Students: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    Applications: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    ),
    Visa: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
            <path d="M9 7h6M9 11h4" />
        </svg>
    ),
    DeferEnrolled: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        </svg>
    ),
    CourseFinder: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    ),
    UniversityList: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    Agents: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    Counselors: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
            <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
    ),
    FileManager: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    Master: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
            <line x1="4" y1="6" x2="8" y2="6" strokeWidth="3" />
            <line x1="13" y1="12" x2="20" y2="12" strokeWidth="3" />
            <line x1="4" y1="18" x2="10" y2="18" strokeWidth="3" />
        </svg>
    ),
    Reports: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    Roles: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
        </svg>
    ),
    Documents: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    ),
    Profile: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
};



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
    { label: "Dashboard", icon: Icons.Dashboard, href: "/dashboard" },
    // { label: "My Notes", icon: <FaStickyNote />, href: "/notes", permission: { action: "VIEW", module: "NOTES" } },
    { label: "Call Center", icon: Icons.CallCenter, href: "/call-center", roles: ["AGENT", "COUNSELOR"] },
    { label: "Leads", icon: Icons.Leads, href: "/leads", roles: ["ADMIN", "MANAGER", "AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT"], permission: { action: "VIEW", module: "LEADS" } },
    { label: "Students", icon: Icons.Students, href: "/students", roles: ["ADMIN", "MANAGER", "AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT"], permission: { action: "VIEW", module: "STUDENTS" } },
    { label: "Applications", icon: Icons.Applications, href: "/applications", roles: ["ADMIN", "MANAGER", "AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT", "STUDENT"], permission: { action: "VIEW", module: "APPLICATIONS" } },
    { label: "Visa Applications", icon: Icons.Visa, href: "/visa-applications", roles: ["ADMIN", "MANAGER", "AGENT", "COUNSELOR", "STUDENT"], permission: { action: "VIEW", module: "VISA" } },
    {
        label: "Defer / Enrolled",
        icon: Icons.DeferEnrolled,
        roles: ["ADMIN", "MANAGER", "AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT"],
        permission: { action: "VIEW", module: "APPLICATIONS" },
        submenu: [
            { label: "Defer Student", href: "/applications?status=DEFERRED", permission: { action: "VIEW", module: "APPLICATIONS" } },
            { label: "Enrolled", href: "/applications?status=ENROLLED", permission: { action: "VIEW", module: "APPLICATIONS" } },
        ]
    },
    {
        label: "Course Finder",
        icon: Icons.CourseFinder,
        href: "/search-programs",
        roles: ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "AGENT", "STUDENT"]
    },
    {
        label: "University List",
        icon: Icons.UniversityList,
        href: "/master/universities",
        roles: ["STUDENT", "AGENT", "COUNSELOR", "SUPER_ADMIN", "ADMIN"]
    },
    {
        label: "File Manager",
        icon: Icons.FileManager,
        href: "/file-manager",
        roles: ["ADMIN", "MANAGER"],
        permission: { action: "VIEW", module: "FILE_MANAGER" }
    },
    {
        label: "Master",
        icon: Icons.Master,
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
    { label: "My Profile", icon: Icons.Profile, href: "/profile", roles: ["STUDENT"] },
    { label: "My Documents", icon: Icons.Documents, href: "/profile?tab=documents", roles: ["STUDENT"] },
    {
        label: "Agents",
        icon: Icons.Agents,
        roles: ["ADMIN"], permission: { action: "VIEW", module: "AGENTS" },
        submenu: [
            { label: "Manage Agents", href: "/agents" },
            { label: "Registration Requests", href: "/agents/requests" },
        ]
    },
    { label: "Counselors", icon: Icons.Counselors, href: "/employees", roles: ["ADMIN", "AGENT"], permission: { action: "VIEW", module: "COUNSELORS" } },
    { label: "Reports", icon: Icons.Reports, href: "/reports", roles: ["ADMIN", "MANAGER", "SUPER_ADMIN"], permission: { action: "VIEW", module: "REPORTS" } },
    {
        label: "Roles & Permissions",
        icon: Icons.Roles,
        href: "/roles",
        roles: ["ADMIN"],
        permission: { action: "VIEW", module: "ROLES" }
    },
];

