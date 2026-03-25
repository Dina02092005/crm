import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || !["ADMIN", "MANAGER", "AGENT", "COUNSELOR"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status");

        const where: any = { deletedAt: null };
        if (status && status !== "ALL") where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ];
        }

        const leads = await prisma.lead.findMany({
            where,
            include: {
                createdBy: { select: { name: true } },
                assignments: {
                    include: {
                        employee: { select: { name: true } }
                    },
                    orderBy: { assignedAt: "desc" },
                    take: 1
                }
            },
            orderBy: { createdAt: "desc" },
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Leads");

        worksheet.columns = [
            { header: "ID", key: "id", width: 15 },
            { header: "Created At", key: "createdAt", width: 20 },
            { header: "Name", key: "name", width: 25 },
            { header: "Email", key: "email", width: 30 },
            { header: "Phone", key: "phone", width: 20 },
            { header: "Status", key: "status", width: 15 },
            { header: "Temperature", key: "temperature", width: 15 },
            { header: "Country", key: "interestedCountry", width: 15 },
            { header: "Source", key: "source", width: 15 },
            { header: "Assigned To", key: "assignedTo", width: 20 },
            { header: "Created By", key: "createdBy", width: 20 },
        ];

        leads.forEach(lead => {
            worksheet.addRow({
                id: lead.id,
                createdAt: lead.createdAt.toLocaleString(),
                name: lead.name,
                email: lead.email || "N/A",
                phone: lead.phone,
                status: lead.status,
                temperature: lead.temperature,
                interestedCountry: lead.interestedCountry || "N/A",
                source: lead.source,
                assignedTo: lead.assignments[0]?.employee?.name || "Unassigned",
                createdBy: lead.createdBy?.name || "System",
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();

        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="leads_export_${new Date().toISOString()}.xlsx"`,
            },
        });
    } catch (error) {
        console.error("Error exporting leads:", error);
        return NextResponse.json({ error: "Failed to export leads" }, { status: 500 });
    }
}
