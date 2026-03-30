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
                    { student: { email: { contains: search, mode: 'insensitive' } } }
                ]
            });
        }

        const [visaApps, total] = await Promise.all([
            prisma.visaApplication.findMany({
                where,
                include: {
                    student: { select: { name: true, email: true } },
                    country: { select: { name: true } },
                    agent: { select: { name: true } },
                    counselor: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.visaApplication.count({ where })
        ]);

        const formattedVisa = visaApps.map(v => ({
            id: v.id,
            student: v.student.name,
            email: v.student.email,
            country: v.country.name,
            visaType: v.visaType,
            status: v.status,
            agent: v.agent?.name || '-',
            counselor: v.counselor?.name || '-',
            biometrics: v.biometricsDone ? 'DONE' : 'PENDING',
            medical: v.medicalDone ? 'DONE' : 'PENDING',
            decisionDate: v.decisionDate,
            createdAt: v.createdAt
        }));

        return NextResponse.json({
            visa: formattedVisa,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching report visa:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
