import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || session.user.role !== "STUDENT") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const student = await prisma.student.findUnique({
            where: { studentUserId: session.user.id }
        });

        if (!student) {
            return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
        }

        const visaApps = await prisma.visaApplication.findMany({
            where: { studentId: student.id },
            include: {
                country: { select: { name: true } },
                university: { select: { name: true } },
                course: { select: { name: true } },
                assignedOfficer: { select: { name: true } },
                agent: { select: { name: true } },
                counselor: { select: { name: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(visaApps);
    } catch (error) {
        console.error("[STUDENT_VISA_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
