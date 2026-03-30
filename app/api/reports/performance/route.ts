import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'AGENT', 'COUNSELOR'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    const { searchParams } = new URL(req.url);

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const agentId = searchParams.get('agentId');
    const counselorId = searchParams.get('counselorId');
    const search = searchParams.get('search') || '';

    try {
        const dateFilter: any = {};
        if (from && to) {
            dateFilter.createdAt = {
                gte: startOfDay(parseISO(from)),
                lte: endOfDay(parseISO(to))
            };
        }

        // Build User Filter
        let userWhere: any = {
            AND: [
                { role: { in: ['AGENT', 'COUNSELOR'] } },
                { isActive: true }
            ]
        };

        if (role === 'COUNSELOR') {
            userWhere.AND.push({ id: userId });
        } else if (role === 'AGENT') {
            const myCounselors = await prisma.user.findMany({
                where: { counselorProfile: { agent: { userId } } },
                select: { id: true }
            });
            const teamIds = [userId, ...myCounselors.map(c => c.id)];
            userWhere.AND.push({ id: { in: teamIds } });
        } else {
            if (agentId) userWhere.AND.push({ id: agentId });
            if (counselorId) userWhere.AND.push({ id: counselorId });
        }

        if (search) {
            userWhere.AND.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            });
        }

        const users = await prisma.user.findMany({
            where: userWhere,
            select: {
                id: true,
                name: true,
                role: true,
                _count: {
                    select: {
                        assignedLeads: { where: { lead: dateFilter } },
                        onboardedStudents: { where: dateFilter },
                        createdApplications: { where: dateFilter },
                        visaOfficerApplications: { where: { ...dateFilter, status: 'VISA_APPROVED' } }
                    }
                },
                assignedLeads: {
                    where: { lead: { ...dateFilter, status: 'CONVERTED' } },
                    select: { id: true }
                },
                createdApplications: {
                    where: { ...dateFilter, status: 'OFFER_RECEIVED' },
                    select: { id: true }
                }
            }
        });

        const performanceData = users.map(u => {
            const leadsAssigned = u._count.assignedLeads;
            const leadsConverted = u.assignedLeads.length;
            const studentsOnboarded = u._count.onboardedStudents;
            const appsCreated = u._count.createdApplications;
            const offersReceived = u.createdApplications.length;
            const visasApproved = u._count.visaOfficerApplications;

            const conversionRate = leadsAssigned > 0 ? ((leadsConverted / leadsAssigned) * 100).toFixed(1) : 0;
            const successRate = appsCreated > 0 ? ((offersReceived / appsCreated) * 100).toFixed(1) : 0;

            return {
                id: u.id,
                userName: u.name,
                role: u.role,
                leadsAssigned,
                leadsConverted,
                studentsOnboarded,
                applicationsCreated: appsCreated,
                offersReceived,
                visasApproved,
                conversionRate: `${conversionRate}%`,
                successRate: `${successRate}%`,
                productivityScore: Math.min(100, (leadsConverted * 5) + (appsCreated * 2) + (visasApproved * 10)) // Simple weighted score
            };
        });

        return NextResponse.json({
            performance: performanceData.sort((a, b) => b.productivityScore - a.productivityScore)
        });
    } catch (error) {
        console.error("Error fetching report performance:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
