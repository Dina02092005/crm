import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);

        const q = searchParams.get('q') || '';
        const intake = searchParams.get('intake');
        const year = searchParams.get('year');
        const country = searchParams.get('country');
        const educationLevel = searchParams.getAll('level[]');
        const duration = searchParams.get('duration');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const where: Prisma.CourseWhereInput = {};

        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { university: { name: { contains: q, mode: 'insensitive' } } }
            ];
        }

        if (country && country !== "ALL") {
            where.university = {
                ...(where.university as Prisma.UniversityWhereInput || {}),
                country: {
                    name: { contains: country, mode: 'insensitive' }
                }
            };
        }

        if (educationLevel && educationLevel.length > 0) {
            where.level = {
                in: educationLevel
            };
        }

        // Intake filtering
        if (intake && intake !== 'All') {
            const intakeMatch = year ? `${intake}-${year}` : intake;
            where.intakes = {
                some: {
                    month: { contains: intakeMatch, mode: 'insensitive' }
                }
            };
        }

        // Duration filtering
        if (duration) {
            if (duration.includes('6 Months')) where.durationMonths = { lte: 6 };
            else if (duration.includes('1 Year')) where.durationMonths = { lte: 12 };
            else if (duration.includes('2 Years')) where.durationMonths = { lte: 24 };
            else if (duration.includes('3 Years')) where.durationMonths = { lte: 36 };
            else if (duration.includes('4 Years')) where.durationMonths = { lte: 48 };
        }

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                include: {
                    university: {
                        include: {
                            country: true
                        }
                    },
                    intakes: true,
                },
                skip,
                take: limit,
                orderBy: { name: 'asc' }
            }),
            prisma.course.count({ where })
        ]);

        return NextResponse.json({
            data: courses,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Program search API error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
