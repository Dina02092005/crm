import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditLogService } from '@/lib/auditLog';

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ message: 'IDs are required' }, { status: 400 });
        }

        const universities = await prisma.university.findMany({
            where: { id: { in: ids } }
        });

        await prisma.university.deleteMany({
            where: { id: { in: ids } }
        });

        // Audit Log
        await AuditLogService.log({
            userId: session.user.id,
            action: "DELETED",
            module: "MASTERS",
            entity: "University",
            entityId: "bulk",
            previousValues: universities
        });

        return NextResponse.json({ message: 'Universities deleted successfully' });
    } catch (error) {
        console.error("Error bulk deleting universities:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
