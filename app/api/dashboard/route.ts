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
            recentLeads,
            leadsLast30Days,
            customersLast30Days
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
            }),
            prisma.lead.findMany({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setDate(new Date().getDate() - 30))
                    }
                },
                select: {
                    createdAt: true
                }
            }),
            prisma.customer.findMany({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setDate(new Date().getDate() - 30))
                    }
                },
                select: {
                    createdAt: true
                }
            })
        ]);

        // Process data for analytics graph
        const analyticsMap = new Map<string, { leads: number, customers: number }>();

        // Initialize last 30 days with 0
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            analyticsMap.set(dateStr, { leads: 0, customers: 0 });
        }

        // Fill leads data
        leadsLast30Days.forEach(lead => {
            const dateStr = lead.createdAt.toISOString().split('T')[0];
            if (analyticsMap.has(dateStr)) {
                analyticsMap.get(dateStr)!.leads++;
            }
        });

        // Fill customers data
        customersLast30Days.forEach(customer => {
            const dateStr = customer.createdAt.toISOString().split('T')[0];
            if (analyticsMap.has(dateStr)) {
                analyticsMap.get(dateStr)!.customers++;
            }
        });

        const analytics = Array.from(analyticsMap.entries()).map(([date, counts]) => ({
            date,
            ...counts
        }));

        return NextResponse.json({
            stats: {
                totalLeads,
                totalCustomers,
                newLeadsToday
            },
            recentLeads,
            analytics
        });

    } catch (error) {
        console.error("[DASHBOARD_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
