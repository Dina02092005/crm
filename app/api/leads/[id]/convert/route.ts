import { NextResponse } from 'next/server';
import { prisma, Role, LeadActivityType, LeadStatus } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
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
        const { action, reason } = body; // action: 'CONVERT' or 'LOST'

        const lead = await prisma.lead.findUnique({ where: { id } });
        if (!lead) {
            return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
        }

        if (action === 'CONVERT') {
            const student = await prisma.$transaction(async (tx) => {
                // 1. Create Student
                const newStudent = await tx.student.create({
                    data: {
                        leadId: id,
                        name: lead.name,
                        email: lead.email,
                        phone: lead.phone,
                        onboardedBy: session.user.id,
                    }
                });

                // 2. Update Lead Status
                await tx.lead.update({
                    where: { id },
                    data: { status: LeadStatus.CLOSED }
                });

                // 3. Log Activity
                await tx.leadActivity.create({
                    data: {
                        leadId: id,
                        userId: session.user.id,
                        type: LeadActivityType.STATUS_CHANGE,
                        content: `Lead converted to student successfully.`
                    }
                });

                return newStudent;
            });



            // Notify Admins & Employee
            try {
                const { notifyAdmins, notifyUser } = await import('@/lib/notifications');
                console.log(`[Notification] Lead converted(Convert Endpoint): ${lead.name} `);

                // Notify Admins
                await notifyAdmins(
                    'Lead Converted',
                    `Lead ${lead.name} has been converted to a student.`,
                    'LEAD_CONVERTED'
                );

                // Notify Assigned Employee (if any)
                // We need to fetch assignments since lead variable only has basic info
                const fullLead = await prisma.lead.findUnique({
                    where: { id },
                    include: { assignments: { take: 1, orderBy: { assignedAt: 'desc' } } }
                });

                const assignedEmployeeId = fullLead?.assignments[0]?.assignedTo;
                if (assignedEmployeeId) {
                    await notifyUser(
                        assignedEmployeeId,
                        'Lead Converted',
                        `Your lead ${lead.name} has been successfully converted to a student.`,
                        'LEAD_CONVERTED'
                    );
                }
            } catch (notifyError) {
                console.error('Notification error in convert route:', notifyError);
            }

            return NextResponse.json(student, { status: 201 });
        } else if (action === 'LOST') {
            await prisma.$transaction(async (tx) => {
                // 1. Update Lead Status
                await tx.lead.update({
                    where: { id },
                    data: { status: LeadStatus.NOT_INTERESTED }
                });

                // 2. Log Activity
                await tx.leadActivity.create({
                    data: {
                        leadId: id,
                        userId: session.user.id,
                        type: LeadActivityType.STATUS_CHANGE,
                        content: `Lead marked as LOST.Reason: ${reason || 'N/A'} `
                    }
                });

                // 3. Close open tasks
                await tx.leadTask.updateMany({
                    where: { leadId: id, status: 'PENDING' },
                    data: { status: 'CANCELLED' }
                });
            });

            return NextResponse.json({ message: 'Lead marked as lost' });
        }

        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Conversion error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
