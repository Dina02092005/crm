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

        // Fetch ALL system permissions to ensure we have the full matrix
        const allPermissions = await prisma.permission.findMany({
            orderBy: [{ module: 'asc' }, { action: 'asc' }]
        });

        // Map system permissions and attach role-specific data if it exists
        const permissions = allPermissions.map(p => {
            const rolePerm = role.permissions.find(rp => rp.permissionId === p.id);
            return {
                id: p.id,
                name: p.name,
                module: p.module,
                action: p.action,
                rolePermission: rolePerm ? {
                    id: rolePerm.id,
                    scope: rolePerm.scope
                } : null
            };
        });

        return NextResponse.json({
            ...role,
            permissions
        });
    } catch (error) {
        console.error("Error fetching role:", error);
        return NextResponse.json({ error: "Failed to fetch role" }, { status: 500 });
    }
});

export const PATCH = withPermission('ROLES', 'EDIT', async (req, { params }) => {
    try {
        const { id: roleId } = await params;
        const body = await req.json();

        // 1. Check if we're updating a single permission (Atomic Update)
        if (body.permissionId) {
            const { permissionId, scope, enabled } = body;

            if (enabled === false) {
                // Delete the RolePermission if it exists
                await prisma.rolePermission.deleteMany({
                    where: { roleId, permissionId }
                });
                return NextResponse.json({ success: true, action: 'removed' });
            } else {
                // Upsert the RolePermission
                const rp = await prisma.rolePermission.upsert({
                    where: {
                        roleId_permissionId: { roleId, permissionId }
                    },
                    update: { scope: scope || "ALL" },
                    create: { roleId, permissionId, scope: scope || "ALL" }
                });
                return NextResponse.json({ success: true, action: 'synced', data: rp });
            }
        }

        // 2. Fallback to existing Full Sync logic if permissions array is provided
        const { name, description, isActive, permissions } = body;

        const role = await prisma.userRole.findUnique({ where: { id: roleId } });
        if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

        const updatedRole = await prisma.$transaction(async (tx) => {
            // Update role basic info
            await tx.userRole.update({
                where: { id: roleId },
                data: { name, description, isActive }
            });

            // If permissions is a list of granular permissions
            if (permissions && Array.isArray(permissions)) {
                await tx.rolePermission.deleteMany({ where: { roleId } });

                const insertData: any[] = [];
                for (const p of permissions) {
                    if (p.rolePermission) {
                        insertData.push({
                            roleId,
                            permissionId: p.id,
                            scope: p.rolePermission.scope || "ALL"
                        });
                    }
                }

                if (insertData.length > 0) {
                    await tx.rolePermission.createMany({ data: insertData });
                }
            }

            return tx.userRole.findUnique({
                where: { id: roleId },
                include: { permissions: { include: { permission: true } } }
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
