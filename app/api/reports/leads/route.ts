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

    // Role-based ID enforcement
    let effectiveAgentId = searchParams.get('agentId');
    let effectiveCounselorId = searchParams.get('counselorId');

    if (role === 'AGENT') {
        effectiveAgentId = userId;
    } else if (role === 'COUNSELOR') {
        effectiveCounselorId = userId;
        effectiveAgentId = null;
    }
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const agentId = searchParams.get('agentId');
    const counselorId = searchParams.get('counselorId');
    const source = searchParams.get('source');
    const country = searchParams.get('country');
    const status = searchParams.get('status');
    const temperature = searchParams.get('temperature');
    const interest = searchParams.get('interest');
    const search = searchParams.get('search') || '';

    try {
        const where: any = {};

        if (from && to) {
            where.createdAt = {
                gte: startOfDay(parseISO(from)),
                lte: endOfDay(parseISO(to))
            };
        }

        if (source) where.source = source;
        if (country) where.interestedCountry = country;
        if (status) where.status = status;
        if (temperature) where.temperature = temperature;
        if (interest) where.interest = interest;

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

            where.assignments = {
                some: {
                    assignedTo: effectiveCounselorId || { in: teamIds }
                }
            };
        } else if (effectiveAgentId || effectiveCounselorId) {
            where.assignments = {
                some: {
                    ...(effectiveAgentId && { assignedTo: effectiveAgentId }),
                    ...(effectiveCounselorId && { assignedTo: effectiveCounselorId })
                }
            };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [leads, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                include: {
                    assignments: {
                        include: {
                            employee: { select: { name: true, role: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.lead.count({ where })
        ]);

        // Format leads for frontend table
        const formattedLeads = leads.map(l => {
            const agent = l.assignments.find(a => a.employee.role === 'AGENT')?.employee.name || '-';
            const counselor = l.assignments.find(a => a.employee.role === 'COUNSELOR')?.employee.name || '-';
            return {
                id: l.id,
                name: l.name,
                phone: l.phone,
                email: l.email,
                source: l.source,
                country: l.interestedCountry,
                agent,
                counselor,
                status: l.status,
                interest: l.interest,
                createdAt: l.createdAt
            };
        });

        return NextResponse.json({
            leads: formattedLeads,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching report leads:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
