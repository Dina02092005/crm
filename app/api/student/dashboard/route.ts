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
            where: { studentUserId: session.user.id },
            select: {
                id: true,
                applications: {
                    select: { id: true, status: true }
                },
                visaApplications: {
                    select: { status: true },
                    take: 1,
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        if (!student) {
            return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
        }

        // Stats
        const totalApplications = student.applications.length;
        const activeApplication = student.applications.find((a: any) => !["ENROLLED", "REJECTED", "WITHDRAWN"].includes(a.status));
        const currentStatus = activeApplication?.status || "NO_ACTIVE_APP";

        const visaApp = student.visaApplications[0]; // Assuming most recent
        const visaStatus = visaApp?.status || "NOT_STARTED";

        // Pending Documents (This is simplified, logic depends on checklist)
        const pendingDocsCount = 0; // Placeholder for now

        // Recent Activity
        const applicationIds = student.applications.map((a: any) => a.id);
        let recentActivity: any[] = [];

        if (applicationIds.length > 0) {
            recentActivity = await prisma.applicationNote.findMany({
                where: {
                    applicationId: { in: applicationIds }
                },
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { name: true, role: true } }
                }
            });
        }

        const responseData = {
            stats: {
                totalApplications,
                currentStatus,
                visaStatus,
                pendingDocsCount
            },
            recentActivity: recentActivity.map((note: any) => ({
                id: note.id,
                type: "NOTE",
                content: note.note,
                createdAt: note.createdAt,
                user: note.user?.name || "System",
                role: note.user?.role || "SYSTEM"
            }))
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("[STUDENT_DASHBOARD_STATS_ERROR]", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        return NextResponse.json({ error: "Internal Error", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
