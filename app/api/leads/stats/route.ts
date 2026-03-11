import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export const GET = withPermission('LEADS', 'VIEW', async (req, { permission }) => {
    try {
        const { user: sessionUser, scope } = permission;

        // Build base where clause matching user scope
        const where: any = { deletedAt: null };

        // RBAC: Dynamic scope-based visibility
        if (scope === 'OWN' || scope === 'ASSIGNED') {
            let assignedToIds = [sessionUser.id];

            if (sessionUser.role === 'AGENT') {
                const agent = await prisma.agentProfile.findUnique({
                    where: { userId: sessionUser.id }
                });
                if (agent) {
                    const subordinates = await prisma.counselorProfile.findMany({
                        where: { agentId: agent.id },
                        select: { userId: true }
                    });
                    assignedToIds.push(...subordinates.map(s => s.userId));
                }
            }

            if (assignedToIds.length > 0) {
                where.OR = [
                    { createdById: { in: assignedToIds } },
                    { assignments: { some: { assignedTo: { in: assignedToIds } } } }
                ];
            }
        }

        const stats = await prisma.lead.groupBy({
            by: ['status'],
            where,
            _count: {
                status: true,
            },
        });

        const counts: Record<string, number> = {
            ALL: 0,
            NEW: 0,
            ASSIGNED: 0,
            IN_PROGRESS: 0,
            FOLLOW_UP: 0,
            CONVERTED: 0,
            LOST: 0,
        };

        let total = 0;

        stats.forEach((group) => {
            const count = group._count.status;
            counts[group.status] = count;
            total += count;
        });

        // ALL should reflect the default list view (Active leads: All except Converted)
        counts.ALL = total - (counts.CONVERTED || 0);

        return NextResponse.json(counts);
    } catch (error) {
        console.error('Fetch leads stats error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
});
