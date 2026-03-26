import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || !["ADMIN", "AGENT", "COUNSELOR"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status");

        const where: any = {};
        if (status && status !== "ALL") where.status = status;
        if (search) {
            where.OR = [
                { student: { name: { contains: search, mode: "insensitive" } } },
                { remarks: { contains: search, mode: "insensitive" } },
            ];
        }

        const visaApps = await prisma.visaApplication.findMany({
            where,
            include: {
                student: true,
                country: true,
                university: true,
                course: true,
                assignedOfficer: { select: { name: true } },
                agent: { select: { name: true } },
                counselor: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Visa Applications");

        worksheet.columns = [
            { header: "ID", key: "id", width: 15 },
            { header: "Created At", key: "createdAt", width: 20 },
            { header: "Student Name", key: "studentName", width: 25 },
            { header: "Country", key: "country", width: 15 },
            { header: "University", key: "university", width: 30 },
            { header: "Course", key: "course", width: 30 },
            { header: "Visa Type", key: "visaType", width: 20 },
            { header: "Status", key: "status", width: 20 },
            { header: "Assigned Officer", key: "assignedOfficer", width: 20 },
            { header: "Counselor", key: "counselor", width: 20 },
            { header: "Agent", key: "agent", width: 20 },
        ];

        visaApps.forEach(app => {
            worksheet.addRow({
                id: app.id,
                createdAt: app.createdAt.toLocaleString(),
                studentName: app.student.name,
                country: app.country.name,
                university: app.university?.name || "N/A",
                course: app.course?.name || "N/A",
                visaType: app.visaType,
                status: app.status,
                assignedOfficer: app.assignedOfficer?.name || "Unassigned",
                counselor: app.counselor?.name || "N/A",
                agent: app.agent?.name || "N/A",
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();

        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="visa_applications_export_${new Date().toISOString()}.xlsx"`,
            },
        });
    } catch (error) {
        console.error("Error exporting visa applications:", error);
        return NextResponse.json({ error: "Failed to export visa applications" }, { status: 500 });
    }
}
