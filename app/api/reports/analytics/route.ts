import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, subDays, format, parseISO } from 'date-fns';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const agentId = searchParams.get('agentId');
    const counselorId = searchParams.get('counselorId');
    const source = searchParams.get('source');
    const country = searchParams.get('country');
    const status = searchParams.get('status');
    const temperature = searchParams.get('temperature');

    try {
        // Build Where Clause
        const where: any = {};

        if (from && to) {
            where.createdAt = {
                gte: startOfDay(parseISO(from)),
                lte: endOfDay(parseISO(to))
            };
        } else if (from) {
            where.createdAt = { gte: startOfDay(parseISO(from)) };
        } else if (to) {
            where.createdAt = { lte: endOfDay(parseISO(to)) };
        }

        if (source) where.source = source;
        if (country) where.interestedCountry = country;
        if (status) where.status = status;
        if (temperature) where.temperature = temperature;

        if (agentId || counselorId) {
            where.assignments = {
                some: {
                    ...(agentId && { assignedTo: agentId }),
                    ...(counselorId && { assignedTo: counselorId })
                }
            };
        }

        // 1. Summary Statistics
        const [
            totalLeads,
            convertedLeads,
            assignedLeads,
            unassignedLeads,
            leadsOverTimeRaw,
            leadsBySourceRaw,
            leadsByCountryRaw,
            agentPerformanceRaw,
            counselorPerformanceRaw
        ] = await Promise.all([
            prisma.lead.count({ where }),
            prisma.lead.count({ where: { ...where, status: 'CONVERTED' } }),
            prisma.lead.count({ where: { ...where, assignments: { some: {} } } }),
            prisma.lead.count({ where: { ...where, assignments: { none: {} } } }),
            // Leads Over Time (Daily)
            prisma.lead.findMany({
                where,
                select: { createdAt: true },
                orderBy: { createdAt: 'asc' }
            }),
            // Leads By Source
            prisma.lead.groupBy({
                by: ['source'],
                where,
                _count: { source: true }
            }),
            // Leads By Country
            prisma.lead.groupBy({
                by: ['interestedCountry'],
                where: { ...where, interestedCountry: { not: null } },
                _count: { interestedCountry: true }
            }),
            // Agent Performance
            prisma.user.findMany({
                where: { role: 'AGENT' },
                select: {
                    id: true,
                    name: true,
                    assignedLeads: {
                        where: { lead: where },
                        select: { id: true, lead: { select: { status: true } } }
                    }
                }
            }),
            // Counselor Performance
            prisma.user.findMany({
                where: { role: 'COUNSELOR' },
                select: {
                    id: true,
                    name: true,
                    assignedLeads: {
                        where: { lead: where },
                        select: { id: true }
                    },
                    counselorStudents: {
                        where: { createdAt: where.createdAt },
                        select: { id: true, applications: { select: { id: true, visaApplications: { select: { id: true } } } } }
                    }
                }
            })
        ]);

        // Process Leads Over Time
        const overTimeMap = new Map();
        leadsOverTimeRaw.forEach(l => {
            const date = format(l.createdAt, 'yyyy-MM-dd');
            overTimeMap.set(date, (overTimeMap.get(date) || 0) + 1);
        });
        const leadsOverTime = Array.from(overTimeMap.entries()).map(([date, count]) => ({ date, count }));

        // Process Agent Performance
        const agentPerformance = agentPerformanceRaw.map(a => ({
            name: a.name,
            assigned: a.assignedLeads.length,
            converted: a.assignedLeads.filter(l => l.lead.status === 'CONVERTED').length
        })).filter(a => a.assigned > 0).sort((a, b) => b.assigned - a.assigned);

        // Process Counselor Performance
        const counselorPerformance = counselorPerformanceRaw.map(c => {
            const students = c.counselorStudents.length;
            const apps = c.counselorStudents.reduce((acc, s) => acc + s.applications.length, 0);
            const visas = c.counselorStudents.reduce((acc, s) => acc + s.applications.reduce((vAcc, a) => vAcc + a.visaApplications.length, 0), 0);
            return {
                name: c.name,
                students,
                applications: apps,
                visaFiled: visas
            };
        }).filter(c => c.students > 0 || c.applications > 0).sort((a, b) => b.students - a.students);

        return NextResponse.json({
            summary: {
                totalLeads,
                convertedLeads,
                assignedLeads,
                unassignedLeads,
                conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0
            },
            charts: {
                leadsOverTime,
                leadsBySource: leadsBySourceRaw.map(s => ({ name: s.source || 'Unknown', value: s._count.source })),
                leadsByCountry: leadsByCountryRaw.map(c => ({ name: c.interestedCountry || 'Unknown', value: c._count.interestedCountry }))
            },
            performance: {
                agents: agentPerformance,
                counselors: counselorPerformance
            }
        });
    } catch (error) {
        console.error("Error fetching report analytics:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
