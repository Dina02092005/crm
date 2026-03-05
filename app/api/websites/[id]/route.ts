import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, url, isActive } = await req.json();
        const website = await prisma.website.update({
            where: { id },
            data: { name, url, isActive }
        });
        return NextResponse.json(website);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Hard delete for the Master list
        await prisma.website.delete({
            where: { id }
        });
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
