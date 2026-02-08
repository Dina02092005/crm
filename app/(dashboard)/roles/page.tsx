import { RolesTable } from "@/components/dashboard/RolesTable";

export default function RolesPage() {
    const roles = [
        {
            name: "Super Admin",
            description: "Full system access",
            users: 2,
            status: "Active",
        },
        {
            name: "Admin",
            description: "Administrative access",
            users: 5,
            status: "Active",
        },
        {
            name: "Manager",
            description: "Management level access",
            users: 12,
            status: "Active",
        },
        {
            name: "Operator",
            description: "Operational access",
            users: 25,
            status: "Active",
        },
        {
            name: "Support",
            description: "Customer support access",
            users: 18,
            status: "Active",
        },
    ];

    return (
        <div className="p-10">
            {/* Page Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Roles & Permissions</h1>

            {/* Roles Table */}
            <RolesTable data={roles} />
        </div>
    );
}
