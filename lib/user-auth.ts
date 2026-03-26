import { Role } from "@prisma/client";

/**
 * Validates if a user with a certain role can create or update a target user to a new role.
 * 
 * Rules:
 * 1. Only SUPER_ADMIN can create or update someone to SUPER_ADMIN or ADMIN.
 * 2. ADMIN can create or update someone to any other role (EMPLOYEE, AGENT, COUNSELOR, etc.)
 */
export function validateRoleUpdate(currentUserRole: Role, targetRole: Role): { allowed: boolean, message?: string } {
    const highPrivilegeRoles: Role[] = ["SUPER_ADMIN", "ADMIN"];

    if (highPrivilegeRoles.includes(targetRole)) {
        if (currentUserRole !== "SUPER_ADMIN") {
            return {
                allowed: false,
                message: "Only Super Admin can create Admin or Super Admin users"
            };
        }
    }

    return { allowed: true };
}

/**
 * Checks if a user has permission to manage another user.
 * 
 * Rules:
 * 1. SUPER_ADMIN can manage everyone.
 * 2. ADMIN can manage everyone EXCEPT other ADMINs and SUPER_ADMINs.
 */
export function canManageUser(currentUserRole: Role, targetUserRole: Role): boolean {
    if (currentUserRole === "SUPER_ADMIN") return true;
    if (currentUserRole === "ADMIN") {
        return !["SUPER_ADMIN", "ADMIN"].includes(targetUserRole);
    }
    return false;
}
