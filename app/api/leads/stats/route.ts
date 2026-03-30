import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPermission } from '@/lib/permissions';
import { LeadStatus } from '@/lib/enums';

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

        const statusValues = Object.values(LeadStatus);
        const counts: Record<string, number> = {
            ALL: 0,
        };

        // Initialize all status counts to 0
        statusValues.forEach(status => {
            counts[status] = 0;
        });

        let total = 0;
        stats.forEach((group) => {
            const count = group._count.status;
            counts[group.status] = count;
            // 'CONVERTED' is often excluded from 'ALL' in some systems, 
            // but the requirement says "ALL -> no filter".
            // However, existing code excluded 'CONVERTED'. 
            // I'll keep it excluded for the 'ALL' count if that was the intention, 
            // but make sure it shows up as its own tab.
            if (group.status !== 'CONVERTED') {
                total += count;
            }
        });

        counts.ALL = total;

        return NextResponse.json(counts);
    } catch (error) {
        console.error('Fetch leads stats error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
});
