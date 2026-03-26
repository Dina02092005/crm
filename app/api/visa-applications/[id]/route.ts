import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { VisaStatus, VisaType } from '@prisma/client';
import {
    notifyApplicationDeferred,
    notifyEnrollmentConfirmed,
} from '@/lib/lifecycle-notifications';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const visaApplication = await prisma.visaApplication.findUnique({
            where: { id },
            include: {
                student: true,
                country: true,
                university: true,
                course: true,
                universityApplication: true,
                assignedOfficer: { select: { name: true, email: true } },
            }
        });

        if (!visaApplication) {
            return NextResponse.json({ message: 'Visa application not found' }, { status: 404 });
        }

        return NextResponse.json(visaApplication);
    } catch (error) {
        console.error('Fetch visa application error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Exclude fields that shouldn't be updated directly via PATCH if needed
        const { id: _, studentId: __, ...updateData } = body;

        // Convert date strings to Date objects
        if (updateData.applicationDate) updateData.applicationDate = new Date(updateData.applicationDate);
        if (updateData.appointmentDate) updateData.appointmentDate = new Date(updateData.appointmentDate);
        if (updateData.decisionDate) updateData.decisionDate = new Date(updateData.decisionDate);
        if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);

        // Auto-assign when moving to ENROLLED or DEFERRED
        if (updateData.status && ["DEFERRED", "ENROLLED"].includes(updateData.status as string)) {
            if (session.user.role === 'COUNSELOR') {
                updateData.counselorId = session.user.id;
                const counselor = await prisma.counselorProfile.findUnique({
                    where: { userId: session.user.id },
                    select: { agentId: true }
                });
                if (counselor && counselor.agentId) {
                    const agent = await prisma.agentProfile.findUnique({ where: { id: counselor.agentId }});
                    if (agent) updateData.agentId = agent.userId;
                }
            } else if (session.user.role === 'AGENT') {
                updateData.agentId = session.user.id;
            }
        }

        // Handle explicit nulls for unassignments
        if (updateData.agentId === null) updateData.agentId = null;
        if (updateData.counselorId === null) updateData.counselorId = null;
        if (updateData.assignedOfficerId === null) updateData.assignedOfficerId = null;

        const visaApplication = await prisma.visaApplication.update({
            where: { id },
            data: updateData,
            include: {
                student: true,
                country: true,
            }
        });

        // Sync status to UniversityApplication if it's FINAL stages
        if (["DEFERRED", "ENROLLED"].includes(visaApplication.status) && visaApplication.universityApplicationId) {
            const uniAppUpdateData: any = { 
                status: visaApplication.status as any 
            };
            
            // Sync assignment so the Univ App remains visible in their dashboard
            if (visaApplication.counselorId || visaApplication.agentId) {
                uniAppUpdateData.assignedToId = visaApplication.counselorId || visaApplication.agentId;
                uniAppUpdateData.assignedById = session.user.id;
            }

            await prisma.universityApplication.update({
                where: { id: visaApplication.universityApplicationId },
                data: uniAppUpdateData
            });

            // Steps 4 & 5: Notify based on final status
            if (visaApplication.status === "DEFERRED") {
                notifyApplicationDeferred(
                    visaApplication.universityApplicationId,
                    session.user.id
                ).catch((err) => console.error('[Lifecycle] notifyApplicationDeferred (visa) failed:', err));
            } else if (visaApplication.status === "ENROLLED") {
                notifyEnrollmentConfirmed(
                    visaApplication.universityApplicationId,
                    session.user.id
                ).catch((err) => console.error('[Lifecycle] notifyEnrollmentConfirmed (visa) failed:', err));
            }
        }

        // Log activity
        await prisma.leadActivity.create({
            data: {
                leadId: (await prisma.student.findUnique({ where: { id: visaApplication.studentId }, select: { leadId: true } }))?.leadId || "",
                userId: session.user.id,
                type: 'NOTE',
                content: `Visa Application (${visaApplication.visaType}) updated for ${visaApplication.student.name}. Status: ${visaApplication.status}.`,
            }
        });

        return NextResponse.json(visaApplication);
    } catch (error) {
        console.error('Update visa application error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const visaApplication = await prisma.visaApplication.findUnique({
            where: { id },
            include: { student: true }
        });

        if (!visaApplication) {
            return NextResponse.json({ message: 'Visa application not found' }, { status: 404 });
        }

        await prisma.visaApplication.delete({
            where: { id }
        });

        // Log activity
        await prisma.leadActivity.create({
            data: {
                leadId: (await prisma.student.findUnique({ where: { id: visaApplication.studentId }, select: { leadId: true } }))?.leadId || "",
                userId: session.user.id,
                type: 'NOTE',
                content: `Visa Application (${visaApplication.visaType}) deleted for ${visaApplication.student.name}.`,
            }
        });

        return NextResponse.json({ message: 'Visa application deleted successfully' });
    } catch (error) {
        console.error('Delete visa application error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
