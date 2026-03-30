import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'AGENT', 'COUNSELOR'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user;

    try {
        const [agents, counselors, countries, sources] = await Promise.all([
            // Get agents
            role === 'ADMIN' || role === 'SUPER_ADMIN' 
                ? prisma.user.findMany({
                    where: { role: 'AGENT', isActive: true },
                    select: { id: true, name: true },
                    orderBy: { name: 'asc' }
                  })
                : Promise.resolve([]),
            
            // Get counselors
            role === 'ADMIN' || role === 'SUPER_ADMIN'
                ? prisma.user.findMany({
                    where: { role: 'COUNSELOR', isActive: true },
                    select: { id: true, name: true },
                    orderBy: { name: 'asc' }
                  })
                : role === 'AGENT'
                    ? prisma.user.findMany({
                        where: { 
                            role: 'COUNSELOR', 
                            isActive: true,
                            counselorProfile: { agent: { userId } }
                        },
                        select: { id: true, name: true },
                        orderBy: { name: 'asc' }
                      })
                    : Promise.resolve([]),

            // Get active countries
            prisma.country.findMany({
                where: { isActive: true },
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            }),

            // Get unique lead sources
            prisma.lead.groupBy({
                by: ['source'],
                where: { source: { not: '' } },
                _count: { source: true },
                orderBy: { source: 'asc' }
            })
        ]);

        return NextResponse.json({
            agents: agents as any[],
            counselors: counselors as any[],
            countries,
            sources: sources.map(s => s.source),
            // Enums for statuses
            leadStatuses: ['NEW', 'CONTACTED', 'UNDER_REVIEW', 'COUNSELLING_SCHEDULED', 'COUNSELLING_COMPLETED', 'FOLLOWUP_REQUIRED', 'INTERESTED', 'NOT_INTERESTED', 'ON_HOLD', 'CLOSED', 'CONVERTED'],
            studentStatuses: ['NEW', 'UNDER_REVIEW', 'COUNSELLING_COMPLETED', 'COUNSELLING_SCHEDULED', 'DOCUMENT_PENDING', 'DOCUMENT_VERIFIED', 'INTERESTED', 'NOT_INTERESTED', 'NOT_ELIGIBLE', 'ON_HOLD', 'APPLICATION_SUBMITTED'],
            applicationStatuses: ['PENDING', 'SUBMITTED', 'APPLIED', 'FINALIZED', 'UNDER_REVIEW', 'OFFER_RECEIVED', 'READY_FOR_VISA', 'VISA_PROCESS', 'ENROLLED', 'DEFERRED', 'REJECTED', 'WITHDRAWN'],
            visaStatuses: ['VISA_GUIDANCE_GIVEN', 'DOCUMENTS_CHECKLIST_SHARED', 'DOCUMENTS_PENDING', 'DOCUMENTS_RECEIVED', 'DOCUMENTS_VERIFIED', 'FINANCIAL_DOCUMENTS_PENDING', 'SPONSORSHIP_DOCUMENTS_PENDING', 'VISA_APPLICATION_IN_PROGRESS', 'VISA_APPLICATION_SUBMITTED', 'BIOMETRICS_SCHEDULED', 'BIOMETRICS_COMPLETED', 'UNDER_REVIEW', 'ADDITIONAL_DOCUMENTS_REQUESTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'VISA_APPROVED', 'VISA_GRANTED', 'VISA_REFUSED', 'VISA_REJECTED', 'VISA_WITHDRAWN', 'DEFERRED', 'ENROLLED', 'PENDING'],
            activityTypes: ['NOTE', 'CALL', 'EMAIL', 'WHATSAPP', 'STATUS_CHANGE', 'TEMPERATURE_CHANGE', 'DOCUMENT_UPLOAD', 'TASK_CREATED', 'APPOINTMENT', 'FOLLOW_UP']
        });
    } catch (error) {
        console.error("Error fetching report filters:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
