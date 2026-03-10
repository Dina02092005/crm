import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PERMISSION_MODULES } from "@/lib/permissions";

import { withPermission } from "@/lib/permissions";

export const GET = withPermission('ROLES', 'VIEW', async (req) => {
    try {
        const roles = await prisma.userRole.findMany({
            include: {
                _count: {
                    select: { users: true }
                }
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json(roles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
    }
});

export const POST = withPermission('ROLES', 'CREATE', async (req) => {
    try {
        const body = await req.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Fetch all system permissions to initialize the role
        const allPermissions = await prisma.permission.findMany();

        // Create role and assign empty permissions for now (or default VIEW)
        const role = await prisma.$transaction(async (tx) => {
            const newRole = await tx.userRole.create({
                data: {
                    name,
                    description,
                    isSystem: false,
                    isActive: true
                }
            });

            // By default, new roles might have no permissions, or we can add VIEW for all
            // For now, let's keep it empty and let the admin configure it
            return newRole;
        });

        return NextResponse.json(role);
    } catch (error: any) {
        console.error("Error creating role:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Role name already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
    }
});
