import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// GET /api/employees - List employees with filters
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const role = searchParams.get("role") || "";
        const status = searchParams.get("status") || "active";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        console.log("API Employees Params:", { search, role, status, page, limit });

        const where: any = {};

        // Search by name or email
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        // Filter by role
        if (role) {
            where.role = role;
        }

        // Filter by status
        if (status === "active") {
            where.isActive = true;
        } else if (status === "inactive") {
            where.isActive = false;
        }

        console.log("API Employees Where:", JSON.stringify(where, null, 2));

        const [employees, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    employeeProfile: {
                        select: {
                            phone: true,
                            department: true,
                        },
                    },
                    _count: {
                        select: {
                            assignedLeads: true,
                            activities: true,
                        },
                    },
                },
                orderBy: {
                    name: 'asc'
                },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            employees,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Fetch employees error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/employees - Create new employee (Admin only)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can create employees
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { name, email, password, role, phone, department } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: "Email already exists" }, { status: 400 });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create employee
        const employee = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: role || "EMPLOYEE",
                emailVerified: new Date(), // Auto-verify employees created by admin
                employeeProfile: {
                    create: {
                        phone: phone || null,
                        department: department || null,
                    },
                },
            },
            include: {
                employeeProfile: true,
            },
        });

        const { passwordHash: _, otp, otpExpiresAt, ...employeeData } = employee;

        // Send welcome email with credentials
        try {
            await sendEmail({
                to: email,
                subject: 'Welcome to TaxiBy - Your Account Credentials',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #6d28d9;">Welcome to TaxiBy!</h2>
                        <p>Hello ${name},</p>
                        <p>Your employee account has been successfully created. You can now login to the dashboard using the following credentials:</p>
                        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
                        </div>
                        <p>Please login and change your password immediately for security.</p>
                        <p>Best regards,<br>The TaxiBy Team</p>
                    </div>
                `,
            });
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            // Continue even if email fails
        }

        return NextResponse.json(employeeData, { status: 201 });
    } catch (error) {
        console.error("Error creating employee:", error);
        return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
    }
}
