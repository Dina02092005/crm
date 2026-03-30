import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { VisaStatus, VisaType } from '@prisma/client';
import { AuditLogService } from '@/lib/auditLog';
import { notifyVisaStarted } from '@/lib/lifecycle-notifications';

import { withPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export const GET = withPermission('VISA', 'VIEW', async (req, { permission }) => {
    try {
        const { user: sessionUser, scope } = permission;

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const visaCountryId = searchParams.get('countryId');
        const visaType = searchParams.get('visaType');
        const visaIntake = searchParams.get('intake');
        const visaAgentId = searchParams.get('agentId');
        const visaCounselorId = searchParams.get('counselorId');
        const skip = (page - 1) * limit;

        const where: any = {};
        if (studentId) {
            where.studentId = studentId;
        }

        if (visaCountryId && visaCountryId !== 'ALL') where.countryId = visaCountryId;
        if (visaType && visaType !== 'ALL') where.visaType = visaType;
        if (visaIntake && visaIntake !== 'ALL') where.intake = { contains: visaIntake, mode: 'insensitive' };
        if (visaAgentId && visaAgentId !== 'ALL') where.agentId = visaAgentId;
        if (visaCounselorId && visaCounselorId !== 'ALL') where.counselorId = visaCounselorId;

        if (status && status !== "ALL") {
            const isValidStatus = Object.values(VisaStatus).includes(status as any);
            if (isValidStatus) {
                where.status = status as VisaStatus;
            } else {
                // If status is provided but not a valid VisaStatus, 
                // we should filter for a non-existent status to return empty results.
                where.status = "INVALID_STATUS_FILTER";
            }
        } else if (!status) {
            // By default, hide applications that have been deferred or enrolled
            where.status = { notIn: ["DEFERRED", "ENROLLED"] as VisaStatus[] };
        }

        if (search) {
            where.OR = [
                { student: { name: { contains: search, mode: 'insensitive' } } },
                { student: { email: { contains: search, mode: 'insensitive' } } },
                { student: { phone: { contains: search, mode: 'insensitive' } } },
                { country: { name: { contains: search, mode: 'insensitive' } } },
                { university: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        // Apply RBAC logic for Visa Applications
        if (scope === 'OWN' || scope === 'ASSIGNED') {
            const secondaryIds = [sessionUser.id];
            
            if (sessionUser.role === 'AGENT') {
                const agent = await prisma.agentProfile.findUnique({
                    where: { userId: sessionUser.id },
                    select: { id: true }
                });
                if (agent) {
                    const counselors = await prisma.counselorProfile.findMany({
                        where: { agentId: agent.id },
                        select: { userId: true }
                    });
                    secondaryIds.push(...counselors.map(c => c.userId));
                }
            } else if (sessionUser.role === 'COUNSELOR') {
                const counselor = await prisma.counselorProfile.findUnique({
                    where: { userId: sessionUser.id },
                    select: { agent: { select: { userId: true } } }
                });
                if (counselor?.agent?.userId) {
                    secondaryIds.push(counselor.agent.userId);
                }
            }

            // Bind to agentId, counselorId, or assignedOfficerId
            // And if none assigned, it's just in the system but invisible to them unless onboarded?
            // Fallback to student onboardedBy just in case
            const scopeFilter = {
                OR: [
                    { agentId: { in: secondaryIds } },
                    { counselorId: { in: secondaryIds } },
                    { assignedOfficerId: { in: secondaryIds } },
                    { student: { onboardedBy: { in: secondaryIds } } },
                    { student: { agentId: { in: secondaryIds } } },
                    { student: { counselorId: { in: secondaryIds } } }
                ]
            };

            // Safely merge with existing where.OR if search exists
            if (where.OR) {
                where.AND = [
                    { OR: where.OR },
                    scopeFilter
                ];
                delete where.OR;
            } else {
                where.OR = scopeFilter.OR;
            }
        }

        const [visaApplications, total] = await Promise.all([
            prisma.visaApplication.findMany({
                where,
                include: {
                    student: { select: { name: true, phone: true, email: true, passportNo: true } },
                    country: { select: { name: true } },
                    university: { select: { name: true } },
                    course: { select: { name: true } },
                    universityApplication: {
                        include: {
                            assignedBy: { select: { name: true, role: true } },
                            assignedTo: { select: { name: true, role: true } },
                            _count: { select: { applicationNotes: true } }
                        }
                    },
                    assignedOfficer: { select: { name: true, role: true } },
                    agent: { select: { name: true, role: true } },
                    counselor: { select: { name: true, role: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.visaApplication.count({ where }),
        ]);

        return NextResponse.json({
            visaApplications,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Fetch visa applications error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            studentId,
            universityApplicationId,
            countryId,
            universityId,
            courseId,
            intake,
            visaType,
            applicationDate,
            appointmentDate,
            decisionDate,
            expiryDate,
            gicTuitionFeePaid,
            medicalDone,
            biometricsDone,
            remarks,
            assignedOfficerId,
            status,
        } = body;

        if (!studentId || !countryId || !visaType) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const visaApplication = await prisma.visaApplication.create({
            data: {
                studentId,
                universityApplicationId: universityApplicationId || null,
                countryId,
                universityId: universityId || null,
                courseId: courseId || null,
                intake: intake || null,
                visaType: visaType as VisaType,
                applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
                appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
                decisionDate: decisionDate ? new Date(decisionDate) : null,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                gicTuitionFeePaid: gicTuitionFeePaid || false,
                medicalDone: medicalDone || false,
                biometricsDone: biometricsDone || false,
                remarks: remarks || null,
                assignedOfficerId: assignedOfficerId || null,
                status: (status as VisaStatus) || VisaStatus.PENDING,
            },
            include: {
                student: true,
                country: true,
            }
        });

        // Log activity
        await prisma.leadActivity.create({
            data: {
                leadId: (await prisma.student.findUnique({ where: { id: studentId }, select: { leadId: true } }))?.leadId || "",
                userId: session.user.id,
                type: 'NOTE',
                content: `New Visa Application (${visaType}) created for ${visaApplication.student.name} to ${visaApplication.country.name}.`,
            }
        });

        // Audit Log
        await AuditLogService.log({
            userId: session.user.id,
            action: "CREATED",
            module: "VISA",
            entity: "VisaApplication",
            entityId: visaApplication.id,
            newValues: visaApplication,
            metadata: { studentId, countryId }
        });

        // Step 3 Lifecycle Notification — Visa Process Started (fire-and-forget)
        notifyVisaStarted(visaApplication.id, session.user.id).catch(
            (err) => console.error('[Lifecycle] notifyVisaStarted (direct) failed:', err)
        );

        return NextResponse.json(visaApplication, { status: 201 });
    } catch (error) {
        console.error('Create visa application error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
