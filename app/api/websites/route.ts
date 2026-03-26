import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    try {
        const where = {
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { url: { contains: search, mode: 'insensitive' as const } }
                ]
            })
        };

        const [websites, total] = await Promise.all([
            prisma.website.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.website.count({ where })
        ]);

        return NextResponse.json({
            websites,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching websites:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN'].includes(session.user.role)) {
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
