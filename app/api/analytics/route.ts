/**
 * GET /api/analytics
 * Admin-only analytics endpoint. Returns all aggregated data in one response.
 * Supports query params: from, to, agentId, country (countryId), intake
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const agentId = searchParams.get("agentId") || undefined;
    const countryId = searchParams.get("country") || undefined;
    const intake = searchParams.get("intake") || undefined;

    // Build date range
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 30);

    const from = fromParam ? new Date(fromParam) : defaultFrom;
    const to = toParam ? new Date(toParam) : now;
    // Ensure `to` covers the full day
    to.setHours(23, 59, 59, 999);

    const dateRange = { gte: from, lte: to };

    // ── Shared filters ───────────────────────────────────────────────────────
    const appWhere: any = {
        createdAt: dateRange,
        ...(countryId && { countryId }),
        ...(intake && { intake }),
        ...(agentId && { agentId }),
    };
    const visaWhere: any = {
        createdAt: dateRange,
        ...(countryId && { countryId }),
        ...(agentId && { agentId }),
    };
    const leadWhere: any = {
        createdAt: dateRange,
        ...(agentId && {
            assignments: { some: { assignedTo: agentId } },
        }),
    };
    const studentWhere: any = {
        createdAt: dateRange,
        ...(agentId && { agentId }),
    };

    // ── Run all aggregations in parallel ─────────────────────────────────────
    const [
        totalLeads,
        totalStudents,
        totalApplications,
        submittedApps,
        deferredApps,
        enrolledAppsByStatus,
        totalVisa,
        approvedVisa,
        enrolledStudentsByStatus,
        newLeadsToday,
        leadsBySource,
        leadsByTemperature,
        leadsByStatus,
        appsByStatus,
        appsByCountryRaw,
        appsByIntake,
        visaByCountryRaw,
        visaByStatus,
        visaProcessing,
        agentUsers,
        totalLeadsAllTime, // Added back for rates
        totalStudentsAllTime,
    ] = await Promise.all([
        // Period-based counts for funnel / specific filters
        prisma.lead.count({ where: leadWhere }),
        prisma.student.count({ where: studentWhere }),
        prisma.universityApplication.count({ where: appWhere }),
        prisma.universityApplication.count({ where: { ...appWhere, status: "SUBMITTED" as any } }),
        prisma.universityApplication.count({ where: { ...appWhere, status: "DEFERRED" as any } }),
        prisma.universityApplication.count({ where: { ...appWhere, status: "ENROLLED" as any } }),
        prisma.visaApplication.count({ where: visaWhere }),
        prisma.visaApplication.count({ where: { ...visaWhere, status: "VISA_APPROVED" as any } }),
        prisma.universityApplication.count({ where: { ...appWhere, status: "ENROLLED" as any } }),

        // New leads today (always today)
        prisma.lead.count({
            where: {
                createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            },
        }),

        // Charts
        prisma.lead.groupBy({
            by: ["source"],
            where: leadWhere,
            _count: { source: true },
            orderBy: { _count: { source: "desc" } },
        }),
        prisma.lead.groupBy({
            by: ["temperature"],
            where: leadWhere,
            _count: { temperature: true },
        }),
        prisma.lead.groupBy({
            by: ["status"],
            where: leadWhere,
            _count: { status: true },
        }),
        prisma.universityApplication.groupBy({
            by: ["status"],
            where: appWhere,
            _count: { status: true },
        }),
        prisma.universityApplication.findMany({
            where: appWhere,
            select: { country: { select: { name: true } } },
        }),
        prisma.universityApplication.groupBy({
            by: ["intake"],
            where: { ...appWhere, intake: { not: null } },
            _count: { intake: true },
            orderBy: { _count: { intake: "desc" } },
        }),
        prisma.visaApplication.findMany({
            where: visaWhere,
            select: { country: { select: { name: true } } },
        }),
        prisma.visaApplication.groupBy({
            by: ["status"],
            where: visaWhere,
            _count: { status: true },
        }),
        // For visa processing time: rows with a decision date
        prisma.visaApplication.findMany({
            where: { ...visaWhere, decisionDate: { not: null } },
            select: { applicationDate: true, decisionDate: true, createdAt: true },
        }),
        // Agent performance — fetch all agents with their counts
        prisma.user.findMany({
            where: { role: "AGENT", isActive: true },
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        agentStudents: true,
                        agentApplications: true,
                    },
                },
            },
        }),
        // All-Time for KPI cards (ignoring dateRange but respecting agent filter if present)
        prisma.lead.count({ where: { ...(agentId && { assignments: { some: { assignedTo: agentId } } }) } }),
        prisma.student.count({ where: { ...(agentId && { agentId }) } }),
    ]);

    // Additional all-time counts for Applications/Visa KPIs
    const [
        totalAppsAllTime,
        totalVisaAllTime,
        approvedVisaAllTime,
        enrolledStudentsAllTime,
    ] = await Promise.all([
        prisma.universityApplication.count({ where: { ...(agentId && { agentId }), ...(countryId && { countryId }) } }),
        prisma.visaApplication.count({ where: { ...(agentId && { agentId }), ...(countryId && { countryId }) } }),
        prisma.visaApplication.count({ where: { status: "VISA_APPROVED" as any, ...(agentId && { agentId }), ...(countryId && { countryId }) } }),
        prisma.universityApplication.count({ where: { status: "ENROLLED" as any, ...(agentId && { agentId }) } }),
    ]);

    // ── Leads over time (group by day) ────────────────────────────────────────
    const leadsOverTimeDays = await prisma.lead.findMany({
        where: leadWhere,
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
    });

    const leadsOverTimeMap = new Map<string, number>();
    leadsOverTimeDays.forEach(({ createdAt }) => {
        const d = createdAt.toISOString().split("T")[0];
        leadsOverTimeMap.set(d, (leadsOverTimeMap.get(d) ?? 0) + 1);
    });
    const leadsOverTime = Array.from(leadsOverTimeMap.entries()).map(([date, count]) => ({ date, count }));

    // ── Country aggregations (from join) ──────────────────────────────────────
    const appCountryMap = new Map<string, number>();
    appsByCountryRaw.forEach(({ country }) => {
        const name = country?.name ?? "Unknown";
        appCountryMap.set(name, (appCountryMap.get(name) ?? 0) + 1);
    });
    const applicationsByCountry = Array.from(appCountryMap.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);

    const visaCountryMap = new Map<string, number>();
    visaByCountryRaw.forEach(({ country }) => {
        const name = country?.name ?? "Unknown";
        visaCountryMap.set(name, (visaCountryMap.get(name) ?? 0) + 1);
    });
    const visaByCountry = Array.from(visaCountryMap.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);

    // ── Visa processing time (avg days) ──────────────────────────────────────
    const visaProcessingDays = visaProcessing.map(({ applicationDate, decisionDate }) => {
        return Math.round(
            (new Date(decisionDate!).getTime() - new Date(applicationDate).getTime()) / (1000 * 60 * 60 * 24)
        );
    });
    const avgVisaProcessingDays =
        visaProcessingDays.length > 0
            ? Math.round(visaProcessingDays.reduce((a, b) => a + b, 0) / visaProcessingDays.length)
            : 0;

    // ── Agent performance ─────────────────────────────────────────────────────
    // We need lead counts per agent (via assignments) — do that separately
    const agentLeadCounts = await prisma.leadAssignment.groupBy({
        by: ["assignedTo"],
        _count: { assignedTo: true },
        where: { lead: { createdAt: dateRange } },
    });
    const agentLeadMap = new Map(agentLeadCounts.map(r => [r.assignedTo, r._count.assignedTo]));

    const agentEnrollments = await prisma.universityApplication.groupBy({
        by: ["agentId"],
        where: { ...appWhere, status: "ENROLLED", agentId: { not: null } },
        _count: { agentId: true },
    });
    const agentEnrollMap = new Map(agentEnrollments.map(r => [r.agentId!, r._count.agentId]));

    const agentPerformance = agentUsers.map((u: any) => {
        const leads = agentLeadMap.get(u.id) ?? 0;
        const students = u._count.agentStudents;
        const applications = u._count.agentApplications;
        const enrollments = agentEnrollMap.get(u.id) ?? 0;
        return {
            agentId: u.id,
            name: u.name,
            leads,
            students,
            applications,
            enrollments,
            conversionRate: leads > 0 ? Math.round((students / leads) * 100) : 0,
        };
    }).sort((a: any, b: any) => b.leads - a.leads);

    // ── KPIs (using All-Time counts for the top cards) ──────────────────────
    const conversionRate = totalLeadsAllTime > 0
        ? Math.round((totalStudentsAllTime / totalLeadsAllTime) * 100)
        : 0;
    const visaSuccessRate = totalVisaAllTime > 0
        ? Math.round((approvedVisaAllTime / totalVisaAllTime) * 100)
        : 0;
    const enrollmentRate = totalStudentsAllTime > 0
        ? Math.round((enrolledStudentsAllTime / totalStudentsAllTime) * 100)
        : 0;

    // ── Funnel (Period-based) ────────────────────────────────────────────────
    const funnel = [
        { stage: "Leads", count: totalLeads },
        { stage: "Students", count: totalStudents },
        { stage: "Applications", count: totalApplications },
        { stage: "Visa Applied", count: totalVisa },
        { stage: "Enrolled", count: enrolledStudentsByStatus },
    ];

    // ── Audit log (non-blocking) ───────────────────────────────────────────────
    AuditLogService.log({
        userId: session.user.id,
        action: "VIEW",
        module: "DASHBOARD",
        entity: "Analytics",
        entityId: session.user.id,
        metadata: { from: from.toISOString(), to: to.toISOString() },
    }).catch(console.error);

    return NextResponse.json({
        kpis: {
            totalLeads: totalLeadsAllTime,
            newLeadsToday,
            totalStudents: totalStudentsAllTime,
            totalApplications: totalAppsAllTime,
            submittedApps,
            deferredApps,
            enrolledApps: enrolledStudentsAllTime, // "Enrolled" KPI usually comes from finalized visa/apps
            totalVisa: totalVisaAllTime,
            approvedVisa: approvedVisaAllTime,
            enrolledStudents: enrolledStudentsAllTime,
            conversionRate,
            visaSuccessRate,
            enrollmentRate,
            avgVisaProcessingDays,
        },
        leadsOverTime,
        leadsBySource: leadsBySource.map(r => ({ source: r.source || "Unknown", count: r._count.source })),
        leadsByTemperature: leadsByTemperature.map(r => ({ temperature: r.temperature, count: r._count.temperature })),
        leadsByStatus: leadsByStatus.map(r => ({ status: r.status, count: r._count.status })),
        applicationsByStatus: appsByStatus.map(r => ({ status: r.status, count: r._count.status })),
        applicationsByCountry,
        applicationsByIntake: appsByIntake.map(r => ({ intake: r.intake || "Unknown", count: r._count.intake })),
        visaByCountry,
        visaByStatus: visaByStatus.map(r => ({ status: r.status, count: r._count.status })),
        agentPerformance,
        funnel,
    });
}
