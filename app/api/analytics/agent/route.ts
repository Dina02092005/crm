import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "AGENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const agentUserId = session.user.id;

        // 1. Get Agent Profile and Team IDs
        const agentProfile = await prisma.agentProfile.findUnique({
            where: { userId: agentUserId },
            include: {
                user: { select: { name: true } },
                counselors: {
                    select: {
                        userId: true,
                        user: { select: { name: true } }
                    }
                }
            }
        });

        if (!agentProfile) return NextResponse.json({ error: "Agent profile not found" }, { status: 404 });

        const counselorUserIds = agentProfile.counselors.map(c => c.userId);
        const teamUserIds = [agentUserId, ...counselorUserIds];

        const { searchParams } = new URL(req.url);
        const fromParam = searchParams.get("from");
        const toParam = searchParams.get("to");
        const countryId = searchParams.get("country") || undefined;
        const intake = searchParams.get("intake") || undefined;
        const counselorFilter = searchParams.get("counselorId") || undefined;

        // Build date range
        const now = new Date();
        const defaultFrom = new Date(now);
        defaultFrom.setDate(defaultFrom.getDate() - 30);

        const from = fromParam ? new Date(fromParam) : defaultFrom;
        const to = toParam ? new Date(toParam) : now;
        to.setHours(23, 59, 59, 999);

        const dateRange = { gte: from, lte: to };

        // Define scoped IDs based on counselor filter if present
        const activeTeamIds = counselorFilter ? [counselorFilter] : teamUserIds;

        // ── Step 1: Pre-fetch Lead IDs to avoid relation filters in groupBy ────
        // This resolves the Prisma limitation: "Filtering by relations in where is not yet supported in groupBy"
        const assignedLeadsRaw = await prisma.leadAssignment.findMany({
            where: {
                assignedTo: { in: activeTeamIds },
                assignedAt: dateRange
            },
            select: { leadId: true }
        });
        const leadIds = Array.from(new Set(assignedLeadsRaw.map(a => a.leadId)));

        // ── Shared filters ───────────────────────────────────────────────────────
        const appWhere: any = {
            createdAt: dateRange,
            OR: [
                { agentId: agentUserId },
                { counselorId: { in: counselorUserIds } }
            ],
            ...(counselorFilter && { counselorId: counselorFilter }),
            ...(countryId && { countryId }),
            ...(intake && { intake }),
        };

        const visaWhere: any = {
            createdAt: dateRange,
            OR: [
                { agentId: agentUserId },
                { counselorId: { in: counselorUserIds } }
            ],
            ...(counselorFilter && { counselorId: counselorFilter }),
            ...(countryId && { countryId }),
        };

        const studentWhere: any = {
            createdAt: dateRange,
            OR: [
                { agentId: agentUserId },
                { counselorId: { in: counselorUserIds } }
            ],
            ...(counselorFilter && { counselorId: counselorFilter }),
        };

        // leadWhere now uses direct ID filtering for speed and groupBy compatibility
        const leadWhere: any = {
            id: { in: leadIds },
            createdAt: dateRange
        };

        // ── Run all aggregations in parallel (Optimized to reduce pool pressure) ──
        const [
            totalLeads,
            totalStudents,
            totalApplications,
            visaInProgress,
            enrollmentsConfirmed,
            newLeadsToday,
            newLeadsMonth,
            leadsByStatus,
            leadsByTemperature,
            leadsBySource,
            leadsOverTimeRaw,
            appsByStatus,
            appsByCountryRaw,
            appsByIntake,
            visaByStatus,
            visaByCountryRaw,
            visaProcessingTimeRaw,
            followUpsToday,
            pendingApps,
            pendingVisaDocs,
            notifications,
            totalLeadsAllTime,
            totalStudentsAllTime,
            // Aggregated breakdown for counselors (Batched)
            teamLeadsRaw,
            teamStudentsRaw,
            teamAppsRaw,
            teamEnrollmentsRaw
        ] = await Promise.all([
            prisma.lead.count({ where: leadWhere }),
            prisma.student.count({ where: studentWhere }),
            prisma.universityApplication.count({ where: appWhere }),
            prisma.visaApplication.count({
                where: {
                    ...visaWhere,
                    status: {
                        in: [
                            "VISA_APPLICATION_IN_PROGRESS",
                            "VISA_APPLICATION_SUBMITTED",
                            "BIOMETRICS_SCHEDULED",
                            "BIOMETRICS_COMPLETED",
                            "UNDER_REVIEW",
                            "ADDITIONAL_DOCUMENTS_REQUESTED",
                            "INTERVIEW_SCHEDULED",
                            "INTERVIEW_COMPLETED"
                        ]
                    }
                }
            }),
            prisma.universityApplication.count({ where: { ...appWhere, status: "ENROLLED" } }),

            prisma.lead.count({ where: { ...leadWhere, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
            prisma.lead.count({ where: { ...leadWhere, createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } }),

            prisma.lead.groupBy({ by: ["status"], where: leadWhere, _count: { status: true } }),
            prisma.lead.groupBy({ by: ["temperature"], where: leadWhere, _count: { temperature: true } }),
            prisma.lead.groupBy({ by: ["source"], where: leadWhere, _count: { source: true } }),
            prisma.lead.findMany({ where: leadWhere, select: { createdAt: true }, orderBy: { createdAt: "asc" } }),

            prisma.universityApplication.groupBy({ by: ["status"], where: appWhere, _count: { status: true } }),
            prisma.universityApplication.findMany({ where: appWhere, select: { country: { select: { name: true } } } }),
            prisma.universityApplication.groupBy({ by: ["intake"], where: { ...appWhere, intake: { not: null } }, _count: { intake: true } }),

            prisma.visaApplication.groupBy({ by: ["status"], where: visaWhere, _count: { status: true } }),
            prisma.visaApplication.findMany({ where: visaWhere, select: { country: { select: { name: true } } } }),
            prisma.visaApplication.findMany({ where: { ...visaWhere, decisionDate: { not: null } }, select: { applicationDate: true, decisionDate: true } }),

            prisma.followUp.findMany({
                where: {
                    userId: { in: activeTeamIds },
                    nextFollowUpAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lte: new Date(new Date().setHours(23, 59, 59, 999)) },
                    status: "PENDING"
                },
                include: { lead: { select: { name: true, phone: true } } },
                take: 10,
                orderBy: { nextFollowUpAt: "asc" }
            }),
            prisma.universityApplication.findMany({ where: { ...appWhere, status: "PENDING" }, include: { student: { select: { name: true } } }, take: 5 }),
            prisma.visaApplication.findMany({ where: { ...visaWhere, status: "DOCUMENTS_PENDING" }, include: { student: { select: { name: true } } }, take: 5 }),
            prisma.notification.findMany({ where: { userId: agentUserId }, take: 5, orderBy: { createdAt: "desc" } }),

            // All-Time
            prisma.leadAssignment.count({ where: { assignedTo: { in: activeTeamIds } } }),
            prisma.student.count({
                where: {
                    OR: [{ agentId: agentUserId }, { counselorId: { in: counselorUserIds } }],
                    ...(counselorFilter && { counselorId: counselorFilter })
                }
            }),

            // Aggregated breakdown - replaced many individual queries with 4 batched queries
            prisma.leadAssignment.groupBy({
                by: ["assignedTo"],
                where: { assignedTo: { in: counselorUserIds }, assignedAt: dateRange },
                _count: { leadId: true }
            }),
            prisma.student.groupBy({
                by: ["counselorId"],
                where: { counselorId: { in: counselorUserIds }, createdAt: dateRange },
                _count: { id: true }
            }),
            prisma.universityApplication.groupBy({
                by: ["counselorId"],
                where: { counselorId: { in: counselorUserIds }, createdAt: dateRange },
                _count: { id: true }
            }),
            prisma.universityApplication.groupBy({
                by: ["counselorId"],
                where: { counselorId: { in: counselorUserIds }, status: "ENROLLED", createdAt: dateRange },
                _count: { id: true }
            })
        ]);

        // ── Step 2: Assemble Counselor Performance Breakdown ─────────────────────
        const counselorPerformance = agentProfile.counselors.map((c) => {
            const leads = teamLeadsRaw.find(r => r.assignedTo === c.userId)?._count.leadId || 0;
            const students = teamStudentsRaw.find(r => r.counselorId === c.userId)?._count.id || 0;
            const apps = teamAppsRaw.find(r => r.counselorId === c.userId)?._count.id || 0;
            const enrollments = teamEnrollmentsRaw.find(r => r.counselorId === c.userId)?._count.id || 0;

            return {
                id: c.userId,
                name: c.user.name,
                leads,
                students,
                applications: apps,
                enrollments,
                conversionRate: leads > 0 ? Math.round((students / leads) * 100) : 0
            };
        });

        // Agent's own leads (not included in counselor groupBy)
        const agentLeadsCount = await prisma.leadAssignment.count({
            where: { assignedTo: agentUserId, assignedAt: dateRange }
        });

        const ownerData = [
            { owner: agentProfile.user.name + " (Agent)", leads: agentLeadsCount },
            ...counselorPerformance.map(c => ({ owner: c.name, leads: c.leads }))
        ];

        // ── Process Chart Data ───────────────────────────────────────────────────
        const leadsOverTimeMap = new Map<string, number>();
        leadsOverTimeRaw.forEach(({ createdAt }) => {
            const date = createdAt.toISOString().split("T")[0];
            leadsOverTimeMap.set(date, (leadsOverTimeMap.get(date) ?? 0) + 1);
        });
        const leadsOverTime = Array.from(leadsOverTimeMap.entries()).map(([date, count]) => ({ date, count }));

        const appsByCountryMap = new Map<string, number>();
        appsByCountryRaw.forEach(({ country }) => {
            const name = country?.name ?? "Unknown";
            appsByCountryMap.set(name, (appsByCountryMap.get(name) ?? 0) + 1);
        });
        const applicationsByCountry = Array.from(appsByCountryMap.entries()).map(([country, count]) => ({ country, count }));

        const visaByCountryMap = new Map<string, number>();
        visaByCountryRaw.forEach(({ country }) => {
            const name = country?.name ?? "Unknown";
            visaByCountryMap.set(name, (visaByCountryMap.get(name) ?? 0) + 1);
        });
        const visaByCountry = Array.from(visaByCountryMap.entries()).map(([country, count]) => ({ country, count }));

        const processingDays = visaProcessingTimeRaw.map(v => {
            return Math.round((new Date(v.decisionDate!).getTime() - new Date(v.applicationDate).getTime()) / (1000 * 60 * 60 * 24));
        });
        const avgVisaProcessingTime = processingDays.length > 0 ? Math.round(processingDays.reduce((a, b) => a + b, 0) / processingDays.length) : 0;

        const funnel = [
            { stage: "Leads", count: totalLeads },
            { stage: "Students", count: totalStudents },
            { stage: "Application", count: totalApplications },
            { stage: "Visa", count: await prisma.visaApplication.count({ where: visaWhere }) },
            { stage: "Enrolled", count: enrollmentsConfirmed }
        ];

        // ── Final Output ─────────────────────────────────────────────────────────
        AuditLogService.log({
            userId: agentUserId,
            action: "VIEW",
            module: "DASHBOARD",
            entity: "AgentAnalytics",
            entityId: agentUserId,
            metadata: { teamSize: counselorUserIds.length, from, to }
        }).catch(console.error);

        return NextResponse.json({
            kpis: {
                totalLeads: totalLeadsAllTime,
                newLeadsToday,
                newLeadsMonth,
                convertedStudents: totalStudentsAllTime,
                activeApplications: totalApplications,
                visaInProgress,
                enrollmentsConfirmed,
                conversionRate: totalLeadsAllTime > 0 ? Math.round((totalStudentsAllTime / totalLeadsAllTime) * 100) : 0,
                avgVisaProcessingTime
            },
            leadsOverTime,
            leadsByStatus: leadsByStatus.map(r => ({ status: r.status, count: r._count.status })),
            leadsByTemperature: leadsByTemperature.map(r => ({ temperature: r.temperature, count: r._count.temperature })),
            leadsBySource: leadsBySource.map(r => ({ source: r.source, count: r._count.source })),
            leadsByOwner: ownerData,
            applicationsByStatus: appsByStatus.map(r => ({ status: r.status, count: r._count.status })),
            applicationsByCountry,
            applicationsByIntake: appsByIntake.map(r => ({ intake: r.intake, count: r._count.intake })),
            visaByStatus: visaByStatus.map(r => ({ status: r.status, count: r._count.status })),
            visaByCountry,
            counselorPerformance,
            funnel,
            widgets: {
                followUps: followUpsToday,
                pendingApps,
                pendingVisaDocs,
                notifications
            }
        });
    } catch (error: any) {
        console.error("Agent analytics error:", error);
        return NextResponse.json({
            error: "Failed to fetch dashboard data",
            details: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        }, { status: 500 });
    }
}
