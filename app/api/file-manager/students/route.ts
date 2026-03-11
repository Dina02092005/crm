import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/permissions';

export const GET = withPermission('FILE_MANAGER', 'VIEW', async (req, { permission }) => {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const source = searchParams.get('source') || '';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.max(1, parseInt(searchParams.get('limit') || '25'));
        const skip = (page - 1) * limit;

        const conditions: any[] = [{ documents: { some: {} } }];

        // Build search filter
        if (search) {
            conditions.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                    { phone: { contains: search, mode: 'insensitive' as const } },
                ],
            });
        }

        if (source && source !== 'ALL') {
            conditions.push({ lead: { source: source } });
        }

        // Apply Permission Scoping
        if (permission.scope === 'ASSIGNED') {
            conditions.push({
                OR: [
                    { counselorId: permission.user.id },
                    { agentId: permission.user.id }
                ]
            });
        } else if (permission.scope === 'OWN') {
            conditions.push({ onboardedBy: permission.user.id });
        }

        const where = { AND: conditions };

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    createdAt: true,
                    _count: { select: { documents: true } },
                },
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            prisma.student.count({ where }),
        ]);

        return NextResponse.json({
            students,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('FILE_MANAGER_STUDENTS_ERROR:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});
