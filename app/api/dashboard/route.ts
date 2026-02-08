import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [
            totalLeads,
            totalCustomers,
            newLeadsToday,
            recentLeads
        ] = await Promise.all([
            prisma.lead.count(),
            prisma.customer.count(),
            prisma.lead.count({
                where: {
                    createdAt: {
                        gte: startOfDay
                    }
                }
            }),
            prisma.lead.findMany({
                take: 5,
                orderBy: { updatedAt: 'desc' },
                include: {
                    customer: true // To get customer details if converted
                }
            })
        ]);

        return NextResponse.json({
            stats: {
                totalLeads,
                totalCustomers,
                newLeadsToday
            },
            recentLeads
        });

    } catch (error) {
        console.error("[DASHBOARD_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
