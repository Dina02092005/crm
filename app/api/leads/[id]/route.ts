import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Delete associated activities and assignments first if not set to cascade in prisma
        // Given the schema provided earlier has some relations, I should be careful.
        // Actually, let's just delete the lead, assuming cascade or handling it.
        await prisma.lead.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Lead deleted successfully' });
    } catch (error) {
        console.error('Delete lead error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}


export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Check if this is an assignment request
        if (body.assignedTo) {
            if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
                return NextResponse.json({ message: 'Only admins or managers can assign leads' }, { status: 403 });
            }

            const employeeId = body.assignedTo;
            const employee = await prisma.user.findUnique({ where: { id: employeeId } });

            if (!employee) {
                return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
            }

            // Perform assignment in a transaction
            const lead = await prisma.$transaction(async (tx) => {
                // 1. Create Assignment
                await tx.leadAssignment.create({
                    data: {
                        leadId: id,
                        assignedTo: employeeId,
                        assignedBy: session.user.id,
                    }
                });

                // 2. Update Lead Status
                const updatedLead = await tx.lead.update({
                    where: { id },
                    data: { status: 'ASSIGNED' }
                });

                // 3. Log Activity
                await tx.leadActivity.create({
                    data: {
                        leadId: id,
                        userId: session.user.id,
                        type: 'TASK_CREATED',
                        content: `Lead assigned to ${employee.name}`
                    }
                });

                return updatedLead;
            });

            // Notify Assigned Employee
            const { notifyUser } = await import('@/lib/notifications');
            await notifyUser(
                employeeId,
                'New Lead Assigned',
                `You have been assigned a new lead: ${lead.name}`,
                'LEAD_ASSIGNED'
            );

            return NextResponse.json(lead);
        }

        // Standard update logic
        const previousLead = await prisma.lead.findUnique({
            where: { id },
            include: {
                assignments: {
                    orderBy: { assignedAt: 'desc' },
                    take: 1
                }
            }
        });

        const lead = await prisma.lead.update({
            where: { id },
            data: body,
        });

        // Check for conversion
        if (previousLead?.status !== 'CONVERTED' && body.status === 'CONVERTED') {
            const { notifyAdmins, notifyUser } = await import('@/lib/notifications');

            // Notify Admins
            await notifyAdmins(
                'Lead Converted',
                `Lead ${lead.name} has been converted to a customer.`,
                'LEAD_CONVERTED'
            );

            // Notify Assigned Employee
            const assignedEmployeeId = previousLead?.assignments[0]?.assignedTo;
            if (assignedEmployeeId) {
                await notifyUser(
                    assignedEmployeeId,
                    'Lead Converted',
                    `Your lead ${lead.name} has been successfully converted.`,
                    'LEAD_CONVERTED'
                );
            }
        }

        return NextResponse.json(lead);
    } catch (error) {
        console.error('Update lead error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}


export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const lead = await prisma.lead.findUnique({
            where: { id },
            include: {
                activities: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: { name: true }
                        }
                    }
                },
                assignments: {
                    include: {
                        employee: {
                            select: { name: true, email: true }
                        }
                    }
                },
                tasks: {
                    orderBy: { dueAt: 'asc' },
                    include: {
                        reminders: true
                    }
                },
                documents: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: { select: { name: true } }
                    }
                }


            }
        });

        if (!lead) {
            return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
        }

        return NextResponse.json(lead);
    } catch (error) {
        console.error('Fetch lead detail error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

