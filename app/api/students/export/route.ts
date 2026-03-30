import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || !["ADMIN", "SUPER_ADMIN", "AGENT", "COUNSELOR"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status");

        const where: any = {};
        if (status && status !== "ALL") where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { passportNo: { contains: search, mode: "insensitive" } },
            ];
        }

        const students = await prisma.student.findMany({
            where,
            include: {
                counselor: { select: { name: true } },
                agent: { select: { name: true } },
                lead: { select: { interestedCountry: true, source: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Students");

        worksheet.columns = [
            { header: "ID", key: "id", width: 15 },
            { header: "Created At", key: "createdAt", width: 20 },
            { header: "Name", key: "name", width: 25 },
            { header: "Email", key: "email", width: 30 },
            { header: "Phone", key: "phone", width: 20 },
            { header: "Passport No", key: "passportNo", width: 20 },
            { header: "Status", key: "status", width: 15 },
            { header: "Interested Country", key: "interestedCountry", width: 20 },
            { header: "Counselor", key: "counselor", width: 20 },
            { header: "Agent/Partner", key: "agent", width: 20 },
            { header: "Source", key: "source", width: 15 },
        ];

        students.forEach(student => {
            worksheet.addRow({
                id: student.id,
                createdAt: student.createdAt.toLocaleString(),
                name: student.name,
                email: student.email,
                phone: student.phone,
                passportNo: student.passportNo || "N/A",
                status: student.status,
                interestedCountry: student.lead?.interestedCountry || "N/A",
                counselor: student.counselor?.name || "Unassigned",
                agent: student.agent?.name || "N/A",
                source: student.lead?.source || "N/A",
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();

        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="students_export_${new Date().toISOString()}.xlsx"`,
            },
        });
    } catch (error) {
        console.error("Error exporting students:", error);
        return NextResponse.json({ error: "Failed to export students" }, { status: 500 });
    }
}
