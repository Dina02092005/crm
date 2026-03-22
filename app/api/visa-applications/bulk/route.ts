import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

// DELETE /api/visa-applications/bulk - Bulk delete visa applications
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // RBAC: Only ADMIN and MANAGER can bulk delete
        if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
        }

        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Invalid request: No IDs provided" }, { status: 400 });
        }

        const visaApplications = await prisma.visaApplication.findMany({
            where: { id: { in: ids } },
            include: { student: true }
        });

        await prisma.visaApplication.deleteMany({
            where: { id: { in: ids } }
        });

        // Audit Logging
        for (const app of visaApplications) {
            await AuditLogService.log({
                userId: session.user.id,
                action: "DELETED",
                module: "VISA",
                entity: "VisaApplication",
                entityId: app.id,
                metadata: {
                    visaType: app.visaType,
                    studentName: app.student?.name
                }
            });
        }

        return NextResponse.json({ message: `${ids.length} visa applications deleted successfully` });
    } catch (error) {
        console.error("Error bulk deleting visa applications:", error);
        return NextResponse.json({ error: "Failed to bulk delete visa applications" }, { status: 500 });
    }
}
