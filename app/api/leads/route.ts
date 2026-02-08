import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');
        const status = searchParams.get('status');
        const source = searchParams.get('source');
        const temperature = searchParams.get('temperature');

        const where: any = {};
        if (status) where.status = status;
        if (source) where.source = source;
        if (temperature) where.temperature = temperature;

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        // RBAC: Employee only sees assigned leads
        if (session.user.role === 'EMPLOYEE') {
            where.assignments = {
                some: {
                    assignedTo: session.user.id
                }
            };
        }

        const leads = await prisma.lead.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                assignments: {
                    include: {
                        employee: {
                            select: { name: true, email: true }
                        }
                    }
                }
            }
        });


        return NextResponse.json(leads);
    } catch (error) {
        console.error('Fetch leads error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const { name, email, phone, message, source } = data;

        if (!name || !phone || !source) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Check for duplicate lead (by phone OR email)
        const existingLead = await prisma.lead.findFirst({
            where: {
                OR: [
                    { phone: phone },
                    ...(email ? [{ email: email }] : []),
                ],
            },
        });

        if (existingLead) {
            return NextResponse.json({
                message: 'A lead with this phone number or email already exists.'
            }, { status: 400 });
        }

        const lead = await prisma.lead.create({
            data: {
                name,
                email,
                phone,
                message,
                source,
            },
        });

        return NextResponse.json(lead, { status: 201 });
    } catch (error) {
        console.error('Create lead error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
