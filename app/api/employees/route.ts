import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/email';
import { sendWelcomeEmail } from '@/lib/mail';
import { validateRoleUpdate } from '@/lib/user-auth';
import { Role } from '@prisma/client';


export const dynamic = 'force-dynamic';

// GET /api/employees - List employees with filters
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // RBAC: 
        // Admin/Manager: All
        // Agent/Sales Rep: Can see Counselors (and maybe themselves? logic below)
        // For now, let's allow authenticated users to fetch, and we can filter in the query if needed or just return all and let frontend filter. 
        // But to be safe, let's restrict what they get back if possible, or just open it up for now as "Employees" list is generally internal directory.
        // The previous code restricted to ADMIN only.

        const userRole = session.user.role;
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'AGENT', 'SALES_REP', 'COUNSELOR', 'SUPPORT_AGENT']; // All staff

        if (!allowedRoles.includes(userRole)) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const role = searchParams.get("role") || "";
        const status = searchParams.get("status") || "active";
        const agentId = searchParams.get("agentId") || ""; // New filter
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        console.log("API Employees Params:", { search, role, status, agentId, page, limit });

        const where: any = {};

        // Filter by Agent ID (if provided)
        if (agentId) {
            where.counselorProfile = {
                agent: {
                    userId: agentId
                }
            };
        }

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

        // AGENT can only see their own subordinates
        if (session.user.role === 'AGENT') {
            const agent = await prisma.agentProfile.findUnique({
                where: { userId: session.user.id }
            });
            if (agent) {
                where.counselorProfile = {
                    agentId: agent.id
                };
            } else {
                where.id = 'none'; // Should not happen but helps security
            }
        }

        // Filter by status
        if (status === "active") {
            where.isActive = true;
        } else if (status === "inactive") {
            where.isActive = false;
        }

        console.log("API Employees Where:", JSON.stringify(where, null, 2));

        // Get total count first
        const total = await prisma.user.count({ where });

        // Then get data - splitting these reduces peak connection usage
        const employees = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                roleId: true,
                roleProfile: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                isActive: true,
                createdAt: true,
                agentProfile: true,
                counselorProfile: {
                    select: {
                        id: true,
                        phone: true,
                        agent: {
                            select: {
                                id: true,
                                companyName: true,
                                user: { select: { name: true } }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        assignedLeads: true,
                        activities: true,
                        onboardedStudents: true,
                    },
                },
            },
            orderBy: {
                name: 'asc'
            },
            skip,
            take: limit,
        });

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

// POST /api/employees - Create new employee (Admin/Manager/Agent?)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        const body = await req.json();
        const { name, firstName, lastName, email, password, role, imageUrl, phone, department, designation, salary, joiningDate, managerId } = body;
        
        const effectiveName = name || (firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || "");

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Restricted Role Creation: Only Super Admin can create Admin/Super Admin
        const roleToAssign = (role || "EMPLOYEE") as Role;
        const { allowed, message } = validateRoleUpdate(session.user.role as Role, roleToAssign);

        if (!allowed) {
            return NextResponse.json({ error: message || "Forbidden" }, { status: 403 });
        }

        // Only staff can create other users
        const canCreateUser = ["SUPER_ADMIN", "ADMIN"].includes(session.user.role);
        if (!canCreateUser) {
            return NextResponse.json({ error: "Unauthorized to create users" }, { status: 403 });
        }

        if (!effectiveName || !email || !password) {
            const missing = [];
            if (!effectiveName) missing.push("name/firstName/lastName");
            if (!email) missing.push("email");
            if (!password) missing.push("password");
            console.warn(`Employee creation failed: Missing fields [${missing.join(", ")}]`, { body });
            return NextResponse.json({ error: `Required fields missing: ${missing.join(", ")}` }, { status: 400 });
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
                name: effectiveName,
                email,
                passwordHash,
                role: roleToAssign,
                createdById: session.user.id,
                roleId: body.roleId || null,
                imageUrl, // Save profile picture
                emailVerified: new Date(), // Auto-verify employees created by admin
                agentProfile: ["AGENT", "SALES_REP"].includes(role) ? {
                    create: {
                        phone: phone || null,
                        companyName: body.companyName || null,
                        commission: body.commission ? parseFloat(body.commission) : null,
                    }
                } : undefined,
                counselorProfile: role === "COUNSELOR" ? {
                    create: {
                        phone: phone || null,
                        department: department || null,
                        designation: designation || null,
                        salary: salary ? parseFloat(salary) : null,
                        joiningDate: joiningDate ? new Date(joiningDate) : null,
                        agentId: body.agentId || null,
                    }
                } : undefined,
            },
            include: {
                agentProfile: true,
                counselorProfile: true,
            },
        });

        const { passwordHash: _, otp, otpExpiresAt, ...employeeData } = employee;

        // Send welcome email with credentials
        try {
            const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`;
            await sendWelcomeEmail({
                email,
                name,
                password,
                loginUrl,
                role: 'Employee'
            });
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            // Continue even if email fails
        }

        return NextResponse.json(employeeData, { status: 201 });
    } catch (error: any) {
        console.error("Error creating employee:", error);
        return NextResponse.json({ error: "Failed to create employee", details: error.message }, { status: 500 });
    }
}
