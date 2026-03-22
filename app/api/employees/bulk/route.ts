import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

// DELETE /api/employees/bulk - Bulk delete employees
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // RBAC: Only ADMIN can bulk delete employees
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
        }

        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Invalid request: No IDs provided" }, { status: 400 });
        }

        // Fetch employees to log their deletion
        const employees = await prisma.user.findMany({
            where: { 
                id: { in: ids },
                role: { in: ["ADMIN", "MANAGER", "COUNSELOR", "AGENT"] } // Ensure we only delete employees
            }
        });

        // We use a transaction to ensure all or nothing
        await prisma.$transaction(async (tx) => {
            // Delete profiles first (Cascade should handle this if configured, but let's be safe)
            await tx.agentProfile.deleteMany({ where: { userId: { in: ids } } });
            await tx.counselorProfile.deleteMany({ where: { userId: { in: ids } } });
            await tx.employeeProfile.deleteMany({ where: { userId: { in: ids } } });
            
            // Delete Users
            await tx.user.deleteMany({
                where: { id: { in: ids } }
            });
        });

        // Audit Logging
        for (const emp of employees) {
            await AuditLogService.log({
                userId: session.user.id,
                action: "DELETED",
                module: "EMPLOYEES",
                entity: "User",
                entityId: emp.id,
                metadata: {
                    name: emp.name,
                    email: emp.email,
                    role: emp.role
                }
            });
        }

        return NextResponse.json({ message: `${ids.length} employees deleted successfully` });
    } catch (error) {
        console.error("Error bulk deleting employees:", error);
        return NextResponse.json({ error: "Failed to bulk delete employees. Ensure no active assignments exist." }, { status: 500 });
    }
}
