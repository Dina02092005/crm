import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [agents, counselors, countries, sources] = await Promise.all([
            // Get all agents
            prisma.user.findMany({
                where: { role: 'AGENT', isActive: true },
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            }),
            // Get all counselors
            prisma.user.findMany({
                where: { role: 'COUNSELOR', isActive: true },
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            }),
            // Get active countries
            prisma.country.findMany({
                where: { isActive: true },
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            }),
            // Get unique lead sources
            prisma.lead.groupBy({
                by: ['source'],
                where: { source: { not: '' } },
                _count: { source: true },
                orderBy: { source: 'asc' }
            })
        ]);

        return NextResponse.json({
            agents,
            counselors,
            countries,
            sources: sources.map(s => s.source)
        });
    } catch (error) {
        console.error("Error fetching report filters:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
