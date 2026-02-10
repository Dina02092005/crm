import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const websites = await prisma.website.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(websites);
    } catch (error) {
        console.error("Error fetching websites:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, url } = await req.json();
        const website = await prisma.website.create({
            data: { name, url }
        });
        return NextResponse.json(website);
    } catch (error) {
        console.error("Error creating website:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
