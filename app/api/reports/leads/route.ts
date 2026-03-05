import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
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

        if (agentId || counselorId) {
            where.assignments = {
                some: {
                    ...(agentId && { assignedTo: agentId }),
                    ...(counselorId && { assignedTo: counselorId })
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
