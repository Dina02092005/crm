import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/permissions';
import { VisaStatus } from '@/lib/enums';

export const dynamic = 'force-dynamic';

export const GET = withPermission('VISA', 'VIEW', async (req, { permission }) => {
    try {
        const { user: sessionUser, scope } = permission;

        const where: any = {};

        // RBAC logic matching app/api/visa-applications/route.ts
        if (scope === 'OWN' || scope === 'ASSIGNED') {
            const secondaryIds: string[] = [sessionUser.id];

            if (sessionUser.role === 'AGENT') {
                const agent = await prisma.agentProfile.findUnique({
                    where: { userId: sessionUser.id },
                    select: { id: true }
                });
                if (agent) {
                    const counselors = await prisma.counselorProfile.findMany({
                        where: { agentId: agent.id },
                        select: { userId: true }
                    });
                    secondaryIds.push(...counselors.map(c => c.userId));
                }
            } else if (sessionUser.role === 'COUNSELOR') {
                const counselor = await prisma.counselorProfile.findUnique({
                    where: { userId: sessionUser.id },
                    select: { agent: { select: { userId: true } } }
                });
                if (counselor?.agent?.userId) {
                    secondaryIds.push(counselor.agent.userId);
                }
            }

            where.OR = [
                { agentId: { in: secondaryIds } },
                { counselorId: { in: secondaryIds } },
                { assignedOfficerId: { in: secondaryIds } },
                { student: { onboardedBy: { in: secondaryIds } } },
                { student: { agentId: { in: secondaryIds } } },
                { student: { counselorId: { in: secondaryIds } } }
            ];
        }

        const stats = await prisma.visaApplication.groupBy({
            by: ['status'],
            where,
            _count: {
                status: true,
            },
        });

        const statusValues = Object.values(VisaStatus);
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
            total += count;
        });
        counts.ALL = total;

        return NextResponse.json(counts);
    } catch (error) {
        console.error('Fetch visa stats error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
});
