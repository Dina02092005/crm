"use client";

import { useSession } from "next-auth/react";
import { PermissionModule, PermissionAction } from "@/lib/permissions";

export function usePermission() {
    const { data: session } = useSession() as any;
    const permissions = session?.user?.permissions || [];

    const can = (action: PermissionAction, module: PermissionModule) => {
        // Super Admin / Admin bypass
        if (permissions.includes("ALL")) return true;

        const permissionName = `${action}_${module}`;
        return permissions.includes(permissionName);
    };

    const hasAny = (perms: { action: PermissionAction; module: PermissionModule }[]) => {
        return perms.some(p => can(p.action, p.module));
    };

    const hasAll = (perms: { action: PermissionAction; module: PermissionModule }[]) => {
        return perms.every(p => can(p.action, p.module));
    };

    return {
        can,
        hasAny,
        hasAll,
        permissions,
        isLoading: !session && session !== null,
        role: session?.user?.role
    };
}
