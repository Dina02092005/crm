import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { ids } = await req.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ message: 'IDs are required' }, { status: 400 });
        }

        await prisma.qualification.deleteMany({
            where: { id: { in: ids } }
        });

        return NextResponse.json({ message: 'Qualifications deleted successfully' });
    } catch (error) {
        console.error("Error bulk deleting qualifications:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
