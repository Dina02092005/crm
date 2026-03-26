import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { ids } = await req.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ message: 'IDs are required' }, { status: 400 });
        }

        await prisma.country.deleteMany({
            where: { id: { in: ids } }
        });

        return NextResponse.json({ message: 'Countries deleted successfully' });
    } catch (error) {
        console.error("Error bulk deleting countries:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
