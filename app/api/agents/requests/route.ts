import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/agents/requests
 * List all agent registration requests (admin only).
 * ?status=PENDING|APPROVED|REJECTED (default: PENDING)
 */
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions) as any;
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || 'PENDING').toUpperCase();
    const search = searchParams.get('search') || '';

    const agents = await prisma.user.findMany({
        where: {
            role: 'AGENT',
            agentProfile: {
                approvalStatus: status as any,
            },
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        },
        select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
            agentProfile: {
                select: {
                    id: true,
                    phone: true,
                    companyName: true,
                    address: true,
                    approvalStatus: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const counts = await prisma.agentProfile.groupBy({
        by: ['approvalStatus'],
        _count: { id: true },
    });
    const countMap: Record<string, number> = {};
    counts.forEach((c) => { countMap[c.approvalStatus] = c._count.id; });

    return NextResponse.json({ agents, counts: countMap });
}

/**
 * PATCH /api/agents/requests
 * Approve or reject an agent.
 * Body: { agentUserId: string, action: 'APPROVED' | 'REJECTED' }
 */
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions) as any;
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { agentUserId, action } = await req.json();
    if (!agentUserId || !['APPROVED', 'REJECTED'].includes(action)) {
        return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    const agentProfile = await prisma.agentProfile.update({
        where: { userId: agentUserId },
        data: { approvalStatus: action },
        include: { user: true },
    });

    // Notify the agent of the decision
    await prisma.notification.create({
        data: {
            userId: agentUserId,
            title: action === 'APPROVED' ? 'Registration Approved!' : 'Registration Not Approved',
            message:
                action === 'APPROVED'
                    ? 'Your agent registration has been approved. You can now log in to your dashboard.'
                    : 'Your agent registration was not approved. Please contact support for assistance.',
            type: 'SYSTEM',
        },
    });

    return NextResponse.json({
        message: `Agent ${action.toLowerCase()} successfully`,
        agent: agentProfile,
    });
}
