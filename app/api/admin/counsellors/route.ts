import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
        }

        const body = await req.json();
        const { firstName, lastName, email, phone, password, roleId, status } = body;

        // Basic validation
        if (!firstName || !lastName || !email || !password) {
            return NextResponse.json({ error: "Required fields missing: firstName, lastName, email, password" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const counsellor = await prisma.user.create({
            data: {
                name: `${firstName} ${lastName}`.trim(),
                email,
                passwordHash,
                role: "COUNSELOR",
                isActive: status === "ACTIVE",
                roleId: roleId || null,
                emailVerified: new Date(),
                counselorProfile: {
                    create: {
                        phone,
                        // Defaults for department/designation since they were requested as optional or simple fields
                        department: body.department || "General",
                        designation: body.designation || "Counselor",
                    },
                },
            },
            include: { counselorProfile: true },
        });

        return NextResponse.json(counsellor, { status: 201 });
    } catch (error: any) {
        console.error('Create counselor error:', error);
        return NextResponse.json({ error: error.message || "Failed to create counselor" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const counsellors = await prisma.user.findMany({
            where: { role: 'COUNSELOR' },
            include: {
                counselorProfile: {
                    include: {
                        agent: {
                            select: {
                                user: { select: { name: true } }
                            }
                        }
                    }
                },
                roleProfile: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(counsellors);
    } catch (error) {
        console.error('Fetch admin counselors error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
