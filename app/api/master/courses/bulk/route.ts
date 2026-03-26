import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !["ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ message: "IDs are required" }, { status: 400 });
        }

        const courses = await prisma.course.findMany({
            where: { id: { in: ids } }
        });

        await prisma.course.deleteMany({
            where: { id: { in: ids } }
        });

        await AuditLogService.log({
            userId: session.user.id,
            action: "DELETED",
            module: "MASTERS",
            entity: "Course",
            entityId: "bulk",
            previousValues: courses
        });

        return NextResponse.json({ message: "Courses deleted successfully" });
    } catch (error) {
        console.error("Error bulk deleting courses:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
