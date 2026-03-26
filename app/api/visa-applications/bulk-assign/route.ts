import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || !["ADMIN", "AGENT"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { ids, assignedToId, agentId, counselorId } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        // The AssignApplicationsModal sends assignedToId. 
        // For Visa, we might need more specific handling if we want to mimic AssignVisaApplicationSheet.
        // But for consistency with other bulk assigns, we'll use the provided counselor/agent logic.
        
        const updateData: any = {};
        if (agentId !== undefined) updateData.agentId = agentId === "none" ? null : agentId;
        if (counselorId !== undefined) updateData.counselorId = counselorId === "none" ? null : counselorId;
        
        // If coming from the unified AssignApplicationsModal, it uses 'assignedToId'
        if (assignedToId) {
            // Verify assigned user role to decide where to put them
            const user = await prisma.user.findUnique({ where: { id: assignedToId }, select: { role: true } });
            if (user?.role === 'COUNSELOR') {
                updateData.counselorId = assignedToId;
            } else if (['AGENT', 'ADMIN'].includes(user?.role || '')) {
                updateData.agentId = assignedToId;
                updateData.assignedOfficerId = assignedToId;
            }
        }

        await prisma.visaApplication.updateMany({
            where: { id: { in: ids } },
            data: updateData
        });

        return NextResponse.json({ message: `${ids.length} visa applications assigned successfully` });
    } catch (error) {
        console.error("Error bulk assigning visa applications:", error);
        return NextResponse.json({ error: "Failed to bulk assign visa applications" }, { status: 500 });
    }
}
