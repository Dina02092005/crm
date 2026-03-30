import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, subDays, format, parseISO } from 'date-fns';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'AGENT', 'COUNSELOR'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user;

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const source = searchParams.get('source');
    const country = searchParams.get('country');
    const status = searchParams.get('status');
    const temperature = searchParams.get('temperature');

    // Role-based ID enforcement
    let effectiveAgentId = searchParams.get('agentId');
    let effectiveCounselorId = searchParams.get('counselorId');

    if (role === 'AGENT') {
        effectiveAgentId = userId;
    } else if (role === 'COUNSELOR') {
        effectiveCounselorId = userId;
        effectiveAgentId = null;
    }

    const search = searchParams.get('search') || '';

    try {
        // Build Where Clause
        const where: any = { AND: [] };
        const and = where.AND;

        if (from && to) {
            and.push({
                createdAt: {
                    gte: startOfDay(parseISO(from)),
                    lte: endOfDay(parseISO(to))
                }
            });
        }

        if (source) and.push({ source });
        if (country) and.push({ interestedCountry: country });
        if (status) and.push({ status });
        if (temperature) and.push({ temperature });

        // Security & Isolation for Leads
        if (role === 'AGENT' || role === 'COUNSELOR') {
            const teamIds = [userId];
            if (role === 'AGENT') {
                const myCounselors = await prisma.user.findMany({
                    where: { counselorProfile: { agent: { userId } } },
                    select: { id: true }
                });
                teamIds.push(...myCounselors.map(c => c.id));
            }

            if (effectiveCounselorId && !teamIds.includes(effectiveCounselorId)) {
                return NextResponse.json({ message: 'Access Denied' }, { status: 403 });
            }

            and.push({
                assignments: {
                    some: {
                        assignedTo: effectiveCounselorId || { in: teamIds }
                    }
                }
            });
        } else if (effectiveAgentId || effectiveCounselorId) {
            and.push({
                assignments: {
                    some: {
                        ...(effectiveAgentId && { assignedTo: effectiveAgentId }),
                        ...(effectiveCounselorId && { assignedTo: effectiveCounselorId })
                    }
                }
            });
        }

        if (search) {
            and.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } }
                ]
            });
        }

        // 1. Fetch Raw Data
        const [
            totalLeads,
            convertedLeads,
            assignedLeads,
            unassignedLeads,
            totalStudents,
            totalApps,
            visaApprovals,
            leadsOverTimeRaw,
            leadsBySourceRaw,
            leadsByCountryRaw,
            appsByStatusRaw,
            visaByStatusRaw,
            hierarchyRaw
        ] = await Promise.all([
            prisma.lead.count({ where }),
            prisma.lead.count({ where: { ...where, AND: [...(where.AND || []), { status: 'CONVERTED' }] } }),
            prisma.lead.count({ where: { ...where, AND: [...(where.AND || []), { assignments: { some: {} } }] } }),
            prisma.lead.count({ where: { ...where, AND: [...(where.AND || []), { assignments: { none: {} } }] } }),
            prisma.student.count({ 
                where: { 
                    AND: where.AND.map((c: any) => {
                        const nc = { ...c };
                        if (nc.interestedCountry) delete nc.interestedCountry; // Students don't have this
                        if (nc.assignments) {
                           // Adapt assignments check if needed, but Student has agentId/counselorId
                           delete nc.assignments;
                        }
                        return nc;
                    }).filter((c: any) => Object.keys(c).length > 0)
                } 
            }),
            prisma.universityApplication.count({ 
                where: { 
                    AND: where.AND.map((c: any) => {
                        const nc = { ...c };
                        if (nc.interestedCountry) delete nc.interestedCountry;
                        if (nc.assignments) delete nc.assignments;
                        if (nc.OR) {
                            // Adapt search OR
                            nc.OR = nc.OR.map((o: any) => {
                                if (o.name || o.email || o.phone) {
                                    return { student: o };
                                }
                                return o;
                            });
                        }
                        return nc;
                    }).filter((c: any) => Object.keys(c).length > 0)
                } 
            }),
            prisma.visaApplication.count({ 
                where: { 
                    AND: [
                        ...where.AND.map((c: any) => {
                            const nc = { ...c };
                            if (nc.interestedCountry) delete nc.interestedCountry;
                            if (nc.assignments) delete nc.assignments;
                            if (nc.OR) {
                                nc.OR = nc.OR.map((o: any) => {
                                    if (o.name || o.email || o.phone) return { student: o };
                                    return o;
                                });
                            }
                            return nc;
                        }),
                        { status: 'VISA_APPROVED' }
                    ].filter((c: any) => Object.keys(c).length > 0)
                } 
            }),
            prisma.lead.findMany({
                where,
                select: { createdAt: true },
                orderBy: { createdAt: 'asc' }
            }),
            prisma.lead.groupBy({
                by: ['source'],
                where,
                _count: { source: true }
            }),
            prisma.lead.groupBy({
                by: ['interestedCountry'],
                where: { ...where, interestedCountry: { not: null } },
                _count: { interestedCountry: true }
            }),
            prisma.universityApplication.groupBy({
                by: ['status'],
                where,
                _count: { status: true }
            }),
            prisma.visaApplication.groupBy({
                by: ['status'],
                where,
                _count: { status: true }
            }),
            // Hierarchical Performance (Admin/SuperAdmin sees all, Agent sees self+team)
            prisma.user.findMany({
                where: {
                    role: 'AGENT',
                    ...(role === 'AGENT' && { id: userId }),
                    ...(role === 'COUNSELOR' && { id: 'NEVER_MATCH' }) // Counselors don't show in agent hierarchy
                },
                select: {
                    id: true,
                    name: true,
                    assignedLeads: {
                        where: { lead: where },
                        select: { id: true, lead: { select: { status: true } } }
                    },
                    agentProfile: {
                        select: {
                            counselors: {
                                select: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            assignedLeads: {
                                                where: { lead: where },
                                                select: { id: true, lead: { select: { status: true } } }
                                            },
                                            counselorStudents: {
                                                where: { createdAt: where.createdAt },
                                                select: { 
                                                    id: true, 
                                                    applications: { 
                                                        select: { id: true, visaApplications: { select: { id: true } } } 
                                                    } 
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })
        ]);

        // 2. Fetch standalone counselor data if Counselor role
        let directCounselorPerformanceRaw: any[] = [];
        if (role === 'COUNSELOR') {
            directCounselorPerformanceRaw = await prisma.user.findMany({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    assignedLeads: {
                        where: { lead: where },
                        select: { id: true, lead: { select: { status: true } } }
                    },
                    counselorStudents: {
                        where: { createdAt: where.createdAt },
                        select: { 
                            id: true, 
                            applications: { 
                                select: { id: true, visaApplications: { select: { id: true } } } 
                            } 
                        }
                    }
                }
            });
        }

        // Process Hierarchical Data
        const hierarchy = hierarchyRaw.map(agent => {
            const counselors = agent.agentProfile?.counselors.map(cp => {
                const c = cp.user;
                const students = c.counselorStudents.length;
                const apps = c.counselorStudents.reduce((acc: number, s: any) => acc + s.applications.length, 0);
                const visas = c.counselorStudents.reduce((acc: number, s: any) => acc + s.applications.reduce((vAcc: number, a: any) => vAcc + a.visaApplications.length, 0), 0);
                return {
                    id: c.id,
                    name: c.name,
                    assigned: c.assignedLeads.length,
                    converted: c.assignedLeads.filter(l => l.lead.status === 'CONVERTED').length,
                    students,
                    applications: apps,
                    visaFiled: visas
                };
            }) || [];

            return {
                id: agent.id,
                name: agent.name,
                assigned: agent.assignedLeads.length,
                converted: agent.assignedLeads.filter(l => l.lead.status === 'CONVERTED').length,
                counselors: counselors.filter(c => c.assigned > 0 || c.students > 0)
            };
        }).filter(a => a.assigned > 0 || a.counselors.length > 0);

        // Process Counselor Performance (Old structure for backward compat or direct role)
        let counselorPerformance: any[] = [];
        if (role === 'COUNSELOR') {
            counselorPerformance = directCounselorPerformanceRaw.map(c => {
                const students = c.counselorStudents.length;
                const apps = c.counselorStudents.reduce((acc: number, s: any) => acc + s.applications.length, 0);
                const visas = c.counselorStudents.reduce((acc: number, s: any) => acc + s.applications.reduce((vAcc: number, a: any) => vAcc + a.visaApplications.length, 0), 0);
                return { name: c.name, students, applications: apps, visaFiled: visas };
            });
        } else {
            // Flatten counselors from hierarchy for legacy performance tab
            counselorPerformance = hierarchy.flatMap(a => a.counselors).sort((a, b) => b.students - a.students);
        }

        // Process Agent Performance
        const agentPerformance = hierarchy.map(a => ({
            name: a.name,
            assigned: a.assigned,
            converted: a.converted
        })).sort((a, b) => b.assigned - a.assigned);

        // Map leads to dates
        const overTimeMap = new Map();
        leadsOverTimeRaw.forEach(l => {
            const date = format(l.createdAt, 'yyyy-MM-dd');
            overTimeMap.set(date, (overTimeMap.get(date) || 0) + 1);
        });

        // Handle Gaps in Timeline (Fill missing days with 0)
        const leadsOverTime: any[] = [];
        let curr = startOfDay(from ? parseISO(from) : subDays(new Date(), 30));
        const end = endOfDay(to ? parseISO(to) : new Date());
        
        while (curr <= end) {
            const dateStr = format(curr, 'yyyy-MM-dd');
            leadsOverTime.push({
                date: dateStr,
                count: overTimeMap.get(dateStr) || 0
            });
            curr.setDate(curr.getDate() + 1);
        }

        return NextResponse.json({
            summary: {
                totalLeads,
                convertedLeads,
                assignedLeads,
                unassignedLeads,
                totalStudents,
                totalApps,
                visaApprovals,
                conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0
            },
            charts: {
                leadsOverTime,
                leadsBySource: leadsBySourceRaw.map(s => ({ name: s.source || 'Unknown', value: s._count.source || 0 })),
                leadsByCountry: leadsByCountryRaw.map(c => ({ name: c.interestedCountry || 'Unknown', value: c._count.interestedCountry || 0 })),
                appsByStatus: appsByStatusRaw.map(a => ({ name: a.status, value: a._count.status })),
                visaByStatus: visaByStatusRaw.map(v => ({ name: v.status, value: v._count.status }))
            },
            performance: {
                agents: agentPerformance,
                counselors: counselorPerformance,
                hierarchy: hierarchy
            }
        });
    } catch (error) {
        console.error("Error fetching report analytics:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
