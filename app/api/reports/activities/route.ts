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

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const type = searchParams.get('type');
    const agentId = searchParams.get('agentId');
    const counselorId = searchParams.get('counselorId');
    const search = searchParams.get('search') || '';

    try {
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

        if (type) and.push({ type });

        // Role-based Security
        if (role === 'COUNSELOR') {
            and.push({ userId });
        } else if (role === 'AGENT') {
            const myCounselors = await prisma.user.findMany({
                where: { counselorProfile: { agent: { userId } } },
                select: { id: true }
            });
            const teamIds = [userId, ...myCounselors.map(c => c.id)];
            and.push({ userId: { in: teamIds } });
        } else {
            if (agentId) and.push({ userId: agentId });
            if (counselorId) and.push({ userId: counselorId });
        }

        // Search
        if (search) {
            and.push({
                OR: [
                    { lead: { name: { contains: search, mode: 'insensitive' } } },
                    { user: { name: { contains: search, mode: 'insensitive' } } },
                    { content: { contains: search, mode: 'insensitive' } }
                ]
            });
        }

        const [activities, total] = await Promise.all([
            prisma.leadActivity.findMany({
                where,
                include: {
                    lead: { select: { name: true } },
                    user: { select: { name: true, role: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.leadActivity.count({ where })
        ]);

        const formattedActivities = activities.map(a => ({
            id: a.id,
            user: a.user.name,
            role: a.user.role,
            type: a.type,
            lead: a.lead.name,
            content: a.content || '-',
            timestamp: a.createdAt
        }));

        return NextResponse.json({
            activities: formattedActivities,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching report activities:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
