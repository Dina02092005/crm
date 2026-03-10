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
                name: { contains: search, mode: 'insensitive' as const }
            })
        };

        const [qualifications, total] = await Promise.all([
            prisma.qualification.findMany({
                where,
                orderBy: { name: 'asc' },
                skip,
                take: limit
            }),
            prisma.qualification.count({ where })
        ]);

        return NextResponse.json({
            qualifications,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching qualifications:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name } = await req.json();

        // Check if already exists
        const existing = await prisma.qualification.findUnique({
            where: { name }
        });

        if (existing) {
            return NextResponse.json({ message: 'Qualification already exists' }, { status: 400 });
        }

        const qualification = await prisma.qualification.create({
            data: { name }
        });
        return NextResponse.json(qualification);
    } catch (error) {
        console.error("Error creating qualification:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
