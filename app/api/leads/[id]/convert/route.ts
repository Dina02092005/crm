import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LeadActivityType, LeadStatus } from '@prisma/client';

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
            const customer = await prisma.$transaction(async (tx) => {
                // 1. Create Customer
                const newCustomer = await tx.customer.create({
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
                    data: { status: LeadStatus.CONVERTED }
                });

                // 3. Log Activity
                await tx.leadActivity.create({
                    data: {
                        leadId: id,
                        userId: session.user.id,
                        type: LeadActivityType.STATUS_CHANGE,
                        content: `Lead converted to customer successfully.`
                    }
                });

                return newCustomer;
            });

            return NextResponse.json(customer, { status: 201 });
        } else if (action === 'LOST') {
            await prisma.$transaction(async (tx) => {
                // 1. Update Lead Status
                await tx.lead.update({
                    where: { id },
                    data: { status: LeadStatus.LOST }
                });

                // 2. Log Activity
                await tx.leadActivity.create({
                    data: {
                        leadId: id,
                        userId: session.user.id,
                        type: LeadActivityType.STATUS_CHANGE,
                        content: `Lead marked as LOST. Reason: ${reason || 'N/A'}`
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
