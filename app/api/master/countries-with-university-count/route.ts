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
            isActive: true,
            ...(search && {
                name: { contains: search, mode: 'insensitive' as const }
            })
        };

        const [countries, total] = await Promise.all([
            prisma.country.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    code: true,
                    _count: {
                        select: { universities: true }
                    }
                },
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            prisma.country.count({ where })
        ]);

        const response = countries.map(c => ({
            id: c.id,
            name: c.name,
            code: c.code,
            universityCount: c._count.universities
        }));

        return NextResponse.json({
            countries: response,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching countries with university count:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
