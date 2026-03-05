import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;

    try {
        const where = {
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { code: { contains: search, mode: 'insensitive' as const } }
                ]
            })
        };

        const [countries, total] = await Promise.all([
            prisma.country.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' }
            }),
            prisma.country.count({ where })
        ]);

        return NextResponse.json({
            countries,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching countries:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        let { name, code } = await req.json();

        // Normalize code: treat empty string as null for unique constraint
        const normalizedCode = (code && code.trim() !== "") ? code.trim() : null;

        // Check if already exists (Name or Code)
        const existing = await prisma.country.findFirst({
            where: {
                OR: [
                    { name: name.trim() },
                    ...(normalizedCode ? [{ code: normalizedCode }] : [])
                ]
            }
        });

        if (existing) {
            return NextResponse.json({
                message: existing.name.toLowerCase() === name.trim().toLowerCase() ? 'Country name already exists' : 'Country code already exists'
            }, { status: 400 });
        }

        const country = await prisma.country.create({
            data: {
                name: name.trim(),
                code: normalizedCode
            }
        });
        return NextResponse.json(country);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ message: 'Country name or code already exists' }, { status: 400 });
        }
        console.error("Error creating country:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
