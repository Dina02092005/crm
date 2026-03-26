import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/permissions';
import { StudentStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export const GET = withPermission('STUDENTS', 'VIEW', async (req, { permission }) => {
    try {
        const { user: sessionUser, scope } = permission;

        const where: any = {
            applications: {
                none: {}
            }
        };

        // RBAC logic matching app/api/students/route.ts
        if (scope === 'OWN' || scope === 'ASSIGNED') {
            const onboardedByIds: string[] = [sessionUser.id];

            if (sessionUser.role === 'AGENT') {
                const agent = await prisma.agentProfile.findUnique({
                    where: { userId: sessionUser.id }
                });
                if (agent) {
                    const subordinates = await prisma.counselorProfile.findMany({
                        where: { agentId: agent.id },
                        select: { userId: true }
                    });
                    onboardedByIds.push(...subordinates.map(s => s.userId));
                }
            }
            where.onboardedBy = { in: onboardedByIds };
        }

        const stats = await prisma.student.groupBy({
            by: ['status'],
            where,
            _count: {
                status: true,
            },
        });

        const counts: Record<string, number> = {
            ALL: 0,
            NEW: 0,
            DOCUMENT_PENDING: 0,
            DOCUMENT_VERIFIED: 0,
            APPLICATION_SUBMITTED: 0,
        };

        let total = 0;
        stats.forEach((group) => {
            const count = group._count.status;
            if (counts[group.status] !== undefined) {
                counts[group.status] = count;
            }
            total += count;
        });
        counts.ALL = total;

        return NextResponse.json(counts);
    } catch (error) {
        console.error('Fetch student stats error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
});
