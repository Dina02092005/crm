import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/permissions";

export const POST = withPermission(
    "ROLES",
    "DELETE",
    async (request: Request) => {
        try {
            const { ids } = await request.json();

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return NextResponse.json(
                    { error: "No IDs provided" },
                    { status: 400 }
                );
            }

            // Prevent deleting system roles via bulk
            const systemRoles = await prisma.userRole.findMany({
                where: {
                    id: { in: ids },
                    isSystem: true
                }
            });

            if (systemRoles.length > 0) {
                return NextResponse.json(
                    { error: "System roles cannot be deleted" },
                    { status: 400 }
                );
            }

            await prisma.userRole.deleteMany({
                where: {
                    id: { in: ids },
                },
            });

            return NextResponse.json({ message: "Roles deleted successfully" });
        } catch (error) {
            console.error("[ROLES_BULK_DELETE]", error);
            return NextResponse.json(
                { error: "Internal Server Error" },
                { status: 500 }
            );
        }
    }
);
