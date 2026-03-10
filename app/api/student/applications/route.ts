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

        const applications = await prisma.universityApplication.findMany({
            where: { studentId: student.id },
            include: {
                university: { select: { name: true } },
                country: { select: { name: true } },
                course: { select: { name: true } },
                agent: { select: { name: true } },
                counselor: { select: { name: true } },
                applicationNotes: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        user: { select: { name: true, role: true, imageUrl: true } }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(applications);
    } catch (error) {
        console.error("[STUDENT_APPLICATIONS_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
