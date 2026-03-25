import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

// DELETE /api/leads/bulk - Bulk delete leads
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // RBAC: ADMIN, MANAGER, and COUNSELOR can bulk delete leads (depending on your specific requirements)
        if (!["ADMIN", "MANAGER", "COUNSELOR"].includes(session.user.role)) {
            return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
        }

        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Invalid request: No IDs provided" }, { status: 400 });
        }

        // Fetch leads to log their deletion
        const leads = await prisma.lead.findMany({
            where: { id: { in: ids } }
        });

        // Delete leads
        await prisma.lead.deleteMany({
            where: { id: { in: ids } }
        });

        // Audit Logging
        for (const lead of leads) {
            await AuditLogService.log({
                userId: session.user.id,
                action: "DELETED",
                module: "LEADS",
                entity: "Lead",
                entityId: lead.id,
                metadata: {
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone
                }
            });
        }

        return NextResponse.json({ message: `${ids.length} leads deleted successfully` });
    } catch (error) {
        console.error("Error bulk deleting leads:", error);
        return NextResponse.json({ error: "Failed to bulk delete leads." }, { status: 500 });
    }
}
