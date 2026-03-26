import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

// DELETE /api/students/bulk - Bulk delete students
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // RBAC: Only ADMIN can bulk delete students
        if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
        }

        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Invalid request: No IDs provided" }, { status: 400 });
        }

        // Fetch students to log their deletion
        const students = await prisma.student.findMany({
            where: { id: { in: ids } },
            include: { user: true }
        });

        // We use a transaction to ensure all or nothing
        await prisma.$transaction(async (tx) => {
            // Delete related records if not cascaded (Prisma might handle some depending on schema)
            // For now, deleteMany on Students. 
            // NOTE: If there are hard foreign key constraints in DB without Cascade, this might fail.
            await tx.student.deleteMany({
                where: { id: { in: ids } }
            });

            // Also delete the corresponding Users if they are STUDENT role
            const userIds = students.map(s => s.studentUserId).filter(Boolean) as string[];
            if (userIds.length > 0) {
                await tx.user.deleteMany({
                    where: { 
                        id: { in: userIds },
                        role: "STUDENT"
                    }
                });
            }
        });

        // Audit Logging
        for (const student of students) {
            await AuditLogService.log({
                userId: session.user.id,
                action: "DELETED",
                module: "STUDENTS",
                entity: "Student",
                entityId: student.id,
                metadata: {
                    studentName: student.name,
                    studentEmail: student.email
                }
            });
        }

        return NextResponse.json({ message: `${ids.length} students deleted successfully` });
    } catch (error) {
        console.error("Error bulk deleting students:", error);
        return NextResponse.json({ error: "Failed to bulk delete students. Ensure no dependent records (like active applications) exist." }, { status: 500 });
    }
}
