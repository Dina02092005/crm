import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

// POST /api/students/bulk-assign - Bulk assign students
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

        // Determine if target is counselor or agent based on employee record
        const employee = await prisma.user.findUnique({
            where: { id: assignedToId },
            select: { role: true }
        });

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        const updateData: any = {};
        if (employee.role === "COUNSELOR") {
            updateData.counselorId = assignedToId;
        } else if (employee.role === "AGENT" || employee.role === "SALES_REP") {
            updateData.agentId = assignedToId;
        } else {
            // Default to counselor field or generic assignedTo if we had one, 
            // but students have counselorId and agentId
            updateData.counselorId = assignedToId;
        }

        await prisma.student.updateMany({
            where: { id: { in: ids } },
            data: updateData
        });

        // Audit Logging
        const students = await prisma.student.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true }
        });

        for (const student of students) {
            await AuditLogService.log({
                userId: session.user.id,
                action: "UPDATED",
                module: "STUDENTS",
                entity: "Student",
                entityId: student.id,
                metadata: {
                    action: "STUDENT_ASSIGNED",
                    assignedToId,
                    role: employee.role,
                    assignedBy: session.user.name
                }
            });
        }

        return NextResponse.json({ message: `${ids.length} students assigned successfully` });
    } catch (error) {
        console.error("Error bulk assigning students:", error);
        return NextResponse.json({ error: "Failed to bulk assign students" }, { status: 500 });
    }
}
