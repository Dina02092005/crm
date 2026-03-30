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
    const status = searchParams.get('status');
    const agentId = searchParams.get('agentId');
    const counselorId = searchParams.get('counselorId');
    const countryId = searchParams.get('countryId');
    const intake = searchParams.get('intake');
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

        if (status) and.push({ status });
        if (countryId) and.push({ countryId });
        if (intake) and.push({ intake });

        // Role-based Security
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
            if (agentId) and.push({ agentId });
            if (counselorId) and.push({ counselorId });
        }

        // Search
        if (search) {
            and.push({
                OR: [
                    { student: { name: { contains: search, mode: 'insensitive' } } },
                    { student: { email: { contains: search, mode: 'insensitive' } } },
                    { university: { name: { contains: search, mode: 'insensitive' } } }
                ]
            });
        }

        const [apps, total] = await Promise.all([
            prisma.universityApplication.findMany({
                where,
                include: {
                    student: { select: { name: true, email: true } },
                    country: { select: { name: true } },
                    university: { select: { name: true } },
                    course: { select: { name: true } },
                    agent: { select: { name: true } },
                    counselor: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.universityApplication.count({ where })
        ]);

        const formattedApps = apps.map(a => ({
            id: a.id,
            student: a.student.name,
            email: a.student.email,
            country: a.country.name,
            university: a.university.name,
            course: a.course?.name || a.courseName || '-',
            intake: a.intake || '-',
            status: a.status,
            agent: a.agent?.name || '-',
            counselor: a.counselor?.name || '-',
            deadline: a.deadlineDate,
            createdAt: a.createdAt
        }));

        return NextResponse.json({
            applications: formattedApps,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching report applications:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
