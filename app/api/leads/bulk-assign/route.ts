import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

// POST /api/leads/bulk-assign - Bulk assign leads
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { ids, assignedToId } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0 || !assignedToId) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        // Verify assignee exists
        const employee = await prisma.user.findUnique({
            where: { id: assignedToId },
            select: { name: true }
        });

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // Bulk create LeadAssignment records instead of just updating a field 
        // (Leads use LeadAssignment model for history)
        await prisma.$transaction(async (tx) => {
            // Create new assigned records
            const assignments = ids.map(id => ({
                leadId: id,
                assignedTo: assignedToId,
                assignedBy: session.user.id
            }));

            await tx.leadAssignment.createMany({
                data: assignments
            });

            // Optional: Update Lead status if needed (e.g. from NEW to UNDER_REVIEW)
            // For now, just logging is enough as per current patterns
        });

        // Audit Logging
        const leads = await prisma.lead.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true }
        });

        for (const lead of leads) {
            await AuditLogService.log({
                userId: session.user.id,
                action: "UPDATED",
                module: "LEADS",
                entity: "Lead",
                entityId: lead.id,
                metadata: {
                    action: "LEAD_ASSIGNED",
                    assignedTo: employee.name,
                    assignedBy: session.user.name
                }
            });
        }

        return NextResponse.json({ message: `${ids.length} leads assigned successfully` });
    } catch (error) {
        console.error("Error bulk assigning leads:", error);
        return NextResponse.json({ error: "Failed to bulk assign leads" }, { status: 500 });
    }
}
