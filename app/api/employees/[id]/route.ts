import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from 'bcryptjs';

// GET /api/employees/[id] - Get employee details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins and managers can view employee details
        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        const employee = await prisma.user.findUnique({
            where: { id },
            include: {
                employeeProfile: true,
                assignedLeads: {
                    include: {
                        lead: {
                            select: {
                                id: true,
                                name: true,
                                status: true,
                                temperature: true,
                                createdAt: true,
                            },
                        },
                    },
                    orderBy: { assignedAt: "desc" },
                    take: 10,
                },
                activities: {
                    select: {
                        id: true,
                        type: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: "desc" },
                    take: 20,
                },
            },
        });

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // Remove sensitive data
        const { passwordHash, otp, otpExpiresAt, ...employeeData } = employee;

        return NextResponse.json(employeeData);
    } catch (error) {
        console.error("Error fetching employee:", error);
        return NextResponse.json({ error: "Failed to fetch employee" }, { status: 500 });
    }
}

// PATCH /api/employees/[id] - Update employee
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Only admins can update employees, or the employee themselves
        if (session.user.role !== "ADMIN" && session.user.id !== id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { name, email, role, phone, department, isActive, password } = body;

        // Only admins can change roles or active status
        if ((role || isActive !== undefined) && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Only admins can change roles or status" }, { status: 403 });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (typeof isActive === 'boolean') updateData.isActive = isActive;

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        const employee = await prisma.user.update({
            where: { id },
            data: {
                ...updateData,
                employeeProfile: {
                    upsert: {
                        create: {
                            phone: phone || null,
                            department: department || null,
                        },
                        update: {
                            ...(phone !== undefined && { phone }),
                            ...(department !== undefined && { department }),
                        },
                    },
                },
            },
            include: {
                employeeProfile: true,
            },
        });

        const { passwordHash, otp, otpExpiresAt, ...employeeData } = employee;

        return NextResponse.json(employeeData);
    } catch (error) {
        console.error("Error updating employee:", error);
        return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
    }
}

// DELETE /api/employees/[id] - Hard Delete (with manual cascade)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can delete employees
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        // Prevent deleting yourself
        if (id === session.user.id) {
            return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
        }

        // Check for onboarding customers (Business Rule: Cannot delete if they own customers)
        const customerCount = await prisma.customer.count({
            where: { onboardedBy: id }
        });

        if (customerCount > 0) {
            return NextResponse.json({
                error: `Cannot delete employee. They have onboarded ${customerCount} customers. Please reassign these customers first.`
            }, { status: 400 });
        }

        // Perform hard delete in a transaction to handle cleanup manually
        await prisma.$transaction(async (tx) => {
            // 1. Delete Lead Assignments (Both as assignee and assigner)
            await tx.leadAssignment.deleteMany({
                where: {
                    OR: [
                        { assignedTo: id },
                        { assignedBy: id }
                    ]
                }
            });

            // 2. Delete Lead Activities
            await tx.leadActivity.deleteMany({
                where: { userId: id }
            });

            // 3. Delete Lead Documents
            await tx.leadDocument.deleteMany({
                where: { uploadedBy: id }
            });

            // 4. Handle Tasks (Delete tasks assigned to user, and their reminders)
            // First find tasks to get their IDs for reminder deletion
            const userTasks = await tx.leadTask.findMany({
                where: { assignedTo: id },
                select: { id: true }
            });

            if (userTasks.length > 0) {
                const taskIds = userTasks.map(t => t.id);
                // Delete reminders for these tasks
                await tx.reminder.deleteMany({
                    where: { taskId: { in: taskIds } }
                });
                // Delete the tasks
                await tx.leadTask.deleteMany({
                    where: { id: { in: taskIds } }
                });
            }

            // 5. Delete Audit Logs
            await tx.auditLog.deleteMany({
                where: { userId: id }
            });

            // 6. Delete Employee Profile
            // Attempt to delete if exists (ignoring if not found is handled by deleteMany or finding first)
            await tx.employeeProfile.deleteMany({
                where: { userId: id }
            });

            // 7. Finally, delete the User
            await tx.user.delete({
                where: { id }
            });
        });

        return NextResponse.json({ message: "Employee permanently deleted" });
    } catch (error) {
        console.error("Error deleting employee:", error);
        return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
    }
}

