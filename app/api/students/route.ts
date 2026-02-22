import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/students - List all students with filters
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const where: any = {};
        const userRole = (session as any).user.role;

        // RBAC: Agent visibility
        if (userRole === 'AGENT' || userRole === 'EMPLOYEE' || userRole === 'COUNSELOR' || userRole === 'SALES_REP' || userRole === 'SUPPORT_AGENT') {
            const onboardedByIds = [(session as any).user.id];

            // For AGENT, also include students onboarded by their subordinates
            if (userRole === 'AGENT') {
                const agent = await prisma.agentProfile.findUnique({
                    where: { userId: (session as any).user.id }
                });
                if (agent) {
                    const subordinates = await prisma.counselorProfile.findMany({
                        where: { agentId: agent.id },
                        select: { userId: true }
                    });
                    onboardedByIds.push(...subordinates.map(s => s.userId));
                }
            }

            where.onboardedBy = { in: onboardedByIds };
        }

        // Search by name, email, or phone
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ];
        }

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    lead: {
                        select: {
                            source: true,
                            temperature: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.student.count({ where }),
        ]);

        return NextResponse.json({
            students,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }
}

// POST /api/students - Create new student (manual entry)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, email, phone, leadId, status } = body;

        if (!name || !phone) {
            return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
        }

        // If leadId is provided, check it's not already converted
        if (leadId) {
            const existingStudent = await prisma.student.findUnique({
                where: { leadId },
            });
            if (existingStudent) {
                return NextResponse.json({ error: "Lead already converted to student" }, { status: 400 });
            }
        }

        // Generate a dummy password: Student@<last 4 digits of phone>
        const last4 = phone.replace(/\D/g, "").slice(-4) || "0000";
        const tempPassword = `Student@${last4}`;
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        // Build a unique login email — use student's email or generate one
        let loginEmail = email;
        if (!loginEmail) {
            const slug = name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
            loginEmail = `${slug}.${last4}@student.intered.app`;
        }

        // Ensure the email is not already taken
        const existingUser = await prisma.user.findUnique({ where: { email: loginEmail } });
        if (existingUser) {
            return NextResponse.json(
                { error: `A user with email ${loginEmail} already exists. Please provide a unique email.` },
                { status: 400 }
            );
        }

        // Create the student user account + student record atomically
        const [studentUser, student] = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name,
                    email: loginEmail,
                    passwordHash,
                    role: "STUDENT",
                    isActive: true,
                    emailVerified: new Date(), // pre-verified since admin is creating
                },
            });

            const newStudent = await tx.student.create({
                data: {
                    name,
                    email: loginEmail,
                    phone,
                    status: status || "NEW",
                    leadId: leadId || null,
                    onboardedBy: session.user.id,
                    imageUrl: body.imageUrl || null,
                    savedAddresses: body.savedAddresses || [],
                    studentUserId: newUser.id,
                },
                include: {
                    user: { select: { name: true, email: true } },
                },
            });

            return [newUser, newStudent];
        });

        // Send welcome email with credentials (non-blocking — don't fail if email fails)
        try {
            const { sendStudentWelcomeEmail } = await import("@/lib/mail");
            const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`;
            await sendStudentWelcomeEmail(loginEmail, name, tempPassword, loginUrl);
        } catch (mailError) {
            console.warn("Welcome email failed (non-fatal):", mailError);
        }

        return NextResponse.json(
            { ...student, studentLoginEmail: loginEmail, studentUserId: studentUser.id },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating student:", error);
        return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
    }
}

