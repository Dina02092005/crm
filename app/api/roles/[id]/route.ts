import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { PERMISSION_MODULES, withPermission } from "@/lib/permissions";

export const GET = withPermission('ROLES', 'VIEW', async (req, { params }) => {
    try {
        const { id } = await params;
        const role = await prisma.userRole.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });

        if (!role) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        // Transform RolePermission records into a grouped module-based structure for the frontend
        const groupedPermissions: Record<string, any> = {};

        role.permissions.forEach(rp => {
            const mod = rp.permission.module;
            if (!groupedPermissions[mod]) {
                groupedPermissions[mod] = {
                    module: mod,
                    actions: [],
                    scope: rp.scope
                };
            }
            groupedPermissions[mod].actions.push(rp.permission.action);
        });

        // Ensure all system modules are present (even with empty actions)
        const finalPermissions = PERMISSION_MODULES.map(module => {
            return groupedPermissions[module] || { module, actions: [], scope: "OWN" };
        });

        return NextResponse.json({
            ...role,
            permissions: finalPermissions
        });
    } catch (error) {
        console.error("Error fetching role:", error);
        return NextResponse.json({ error: "Failed to fetch role" }, { status: 500 });
    }
});

export const PATCH = withPermission('ROLES', 'EDIT', async (req, { params }) => {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, description, isActive, permissions } = body;

        const role = await prisma.userRole.findUnique({ where: { id } });
        if (!role) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        // Update role and its permissions
        const updatedRole = await prisma.$transaction(async (tx) => {
            // 1. Update basic info
            await tx.userRole.update({
                where: { id },
                data: {
                    name,
                    description,
                    isActive
                }
            });

            // 2. If permissions are provided, sync them
            if (permissions && Array.isArray(permissions)) {
                // First, delete old permissions for this role
                await tx.rolePermission.deleteMany({
                    where: { roleId: id }
                });

                // Fetch all existing permissions to match them in-memory
                const allSystemPermissions = await tx.permission.findMany();
                const permissionsDataToInsert: any[] = [];

                // Match and prepare
                for (const p of permissions) {
                    if (!p.actions || p.actions.length === 0) continue;

                    for (const action of p.actions) {
                        const permRecord = allSystemPermissions.find(
                            sp => sp.module === p.module && sp.action === action
                        );

                        if (permRecord) {
                            permissionsDataToInsert.push({
                                roleId: id,
                                permissionId: permRecord.id,
                                scope: p.scope || "OWN"
                            });
                        }
                    }
                }

                // Bulk insert
                if (permissionsDataToInsert.length > 0) {
                    await tx.rolePermission.createMany({
                        data: permissionsDataToInsert
                    });
                }
            }

            return tx.userRole.findUnique({
                where: { id },
                include: {
                    permissions: {
                        include: { permission: true }
                    }
                }
            });
        });

        return NextResponse.json(updatedRole);
    } catch (error) {
        console.error("Error updating role:", error);
        return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    }
});

export const DELETE = withPermission('ROLES', 'DELETE', async (req, { params }) => {
    try {
        const { id } = await params;
        const role = await prisma.userRole.findUnique({
            where: { id },
            include: { _count: { select: { users: true } } }
        });

        if (!role) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        if (role.isSystem) {
            return NextResponse.json({ error: "System roles cannot be deleted" }, { status: 400 });
        }

        if (role._count.users > 0) {
            return NextResponse.json({ error: "Cannot delete role with assigned users" }, { status: 400 });
        }

        await prisma.userRole.delete({ where: { id } });

        return NextResponse.json({ message: "Role deleted successfully" });
    } catch (error) {
        console.error("Error deleting role:", error);
        return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
    }
});
