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
    const agentId = searchParams.get('agentId');
    const counselorId = searchParams.get('counselorId');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';

    try {
        const where: any = { AND: [] };
        const and = where.AND;

        // Date filter
        if (from && to) {
            and.push({
                createdAt: {
                    gte: startOfDay(parseISO(from)),
                    lte: endOfDay(parseISO(to))
                }
            });
        }

        if (status) and.push({ status });

        // Role-based Security & Hierarchical Filtering
        if (role === 'COUNSELOR') {
            and.push({ counselorId: userId });
        } else if (role === 'AGENT') {
            const myCounselors = await prisma.user.findMany({
                where: { counselorProfile: { agent: { userId } } },
                select: { id: true }
            });
            const teamIds = [userId, ...myCounselors.map(c => c.id)];
            and.push({
                OR: [
                    { agentId: userId },
                    { counselorId: { in: teamIds } }
                ]
            });
        } else {
            // Admin/Super Admin can filter by specific agent/counselor
            if (agentId) and.push({ agentId });
            if (counselorId) and.push({ counselorId });
        }

        // Global Search
        if (search) {
            and.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } }
                ]
            });
        }

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                include: {
                    agent: { select: { name: true } },
                    counselor: { select: { name: true } },
                    _count: { select: { applications: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.student.count({ where })
        ]);

        const formattedStudents = students.map(s => ({
            id: s.id,
            name: s.name,
            phone: s.phone,
            email: s.email,
            status: s.status,
            agent: s.agent?.name || '-',
            counselor: s.counselor?.name || '-',
            applicationsCount: s._count.applications,
            createdAt: s.createdAt
        }));

        return NextResponse.json({
            students: formattedStudents,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching report students:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
