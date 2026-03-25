import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPermission } from '@/lib/permissions';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

export const GET = withPermission('LEADS', 'VIEW', async (req, { permission }) => {
    try {
        const { user: sessionUser, scope } = permission;
        const session = { user: sessionUser };

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');
        const status = searchParams.get('status');
        const source = searchParams.get('source');
        const temperature = searchParams.get('temperature');
        const assignedTo = searchParams.get('assignedTo');
        const interestedCountry = searchParams.get('interestedCountry');
        const highestQualification = searchParams.get('highestQualification');
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const interest = searchParams.get('interest');

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const where: any = { deletedAt: null };
        if (status && status !== 'ALL') {
            where.status = status;
        } else {
            // By default, exclude CONVERTED leads from the "All" view to keep active list clean
            where.status = { not: 'CONVERTED' };
        }

        if (source && source !== 'ALL') where.source = source;
        if (temperature && temperature !== 'ALL') where.temperature = temperature;
        if (interestedCountry && interestedCountry !== 'ALL') where.interestedCountry = { contains: interestedCountry, mode: 'insensitive' };
        if (highestQualification && highestQualification !== 'ALL') where.highestQualification = { contains: highestQualification, mode: 'insensitive' };
        if (interest && interest !== 'ALL') where.interest = interest;

        if (from && to && from !== "" && to !== "") {
            where.createdAt = {
                gte: startOfDay(parseISO(from)),
                lte: endOfDay(parseISO(to))
            };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        // RBAC: Dynamic scope-based visibility
        const isFilteringSpecificCounselor = assignedTo && assignedTo !== 'ALL' && assignedTo !== '';

        if (scope === 'OWN' || scope === 'ASSIGNED' || isFilteringSpecificCounselor) {
            let assignedToIds: string[] = [];

            if (scope === 'OWN' || scope === 'ASSIGNED') {
                assignedToIds = [session.user.id];

                if (session.user.role === 'AGENT') {
                    const agent = await prisma.agentProfile.findUnique({
                        where: { userId: session.user.id }
                    });
                    if (agent) {
                        const subordinates = await prisma.counselorProfile.findMany({
                            where: { agentId: agent.id },
                            select: { userId: true }
                        });
                        assignedToIds.push(...subordinates.map(s => s.userId));
                    }
                }

                // If user matched scope but also provided a specific assignedTo filter
                if (isFilteringSpecificCounselor && !assignedToIds.includes(assignedTo!)) {
                    // Force zero results if they filter by someone they can't see
                    where.id = "none";
                } else if (isFilteringSpecificCounselor) {
                    assignedToIds = [assignedTo!];
                }
            } else if (isFilteringSpecificCounselor) {
                // User has ALL scope but specifically filtered by assignedTo
                assignedToIds = [assignedTo!];
            }

            if (where.id !== "none" && assignedToIds.length > 0) {
                const rbacOr = {
                    OR: [
                        { createdById: { in: assignedToIds } },
                        { assignments: { some: { assignedTo: { in: assignedToIds } } } }
                    ]
                };

                if (where.OR) {
                    where.AND = [
                        ...(where.AND || []),
                        { OR: where.OR },
                        rbacOr
                    ];
                    delete where.OR;
                } else if (where.AND) {
                    where.AND.push(rbacOr);
                } else {
                    where.OR = rbacOr.OR;
                }
            }
        }

        const [leads, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    assignments: {
                        include: {
                            employee: {
                                select: { name: true, email: true }
                            }
                        }
                    }
                }
            }),
            prisma.lead.count({ where })
        ]);

        return NextResponse.json({
            leads,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Fetch leads error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
});

export const POST = withPermission('LEADS', 'CREATE', async (req, { permission }) => {
    try {
        const rawBody = await req.json();
        const { followUp, appointment, ...body } = rawBody;

        // -- Null-coerce optional enum + date fields -------------------------
        // These must be null (not "") so Prisma/DB doesn't reject enum/date constraints
        const keysToNull = ['interest', 'dateOfBirth', 'passportIssueDate', 'passportExpiryDate', 'email', 'intake', 'gender', 'nationality', 'maritalStatus', 'address', 'highestQualification', 'testName', 'testScore', 'interestedCourse', 'interestedCountry'];

        keysToNull.forEach(key => {
            if (body[key] === "" || body[key] === undefined) {
                body[key] = null;
            }
        });

        if (body.dateOfBirth) body.dateOfBirth = new Date(body.dateOfBirth);
        if (body.passportIssueDate) body.passportIssueDate = new Date(body.passportIssueDate);
        if (body.passportExpiryDate) body.passportExpiryDate = new Date(body.passportExpiryDate);

        if (Array.isArray(body.intake)) {
            body.intake = body.intake.join(', ');
        }

        // -- Build name from firstName + lastName if not supplied explicitly --
        if (!body.name || body.name === "") {
            const name = [body.firstName, body.lastName]
                .map((s: string) => s?.trim())
                .filter(Boolean)
                .join(" ");
            body.name = name || "Unknown Lead";
        }

        const lead = await prisma.lead.create({
            data: {
                ...body,
                createdById: permission.user.id,
                status: body.status || 'NEW',
                temperature: body.temperature || 'COLD',
                // Automatically assign leads created by Counselors or Agents to themselves
                ...((permission.user.role === 'COUNSELOR' || permission.user.role === 'AGENT') ? {
                    assignments: {
                        create: {
                            assignedTo: permission.user.id,
                            assignedBy: permission.user.id,
                        }
                    }
                } : {}),
                ...(followUp?.nextFollowUpAt ? {
                    followUps: {
                        create: {
                            userId: permission.user.id,
                            type: "INITIAL",
                            status: "PENDING",
                            nextFollowUpAt: new Date(followUp.nextFollowUpAt),
                            remark: followUp.remark,
                        }
                    }
                } : {}),
                ...(appointment?.startTime ? {
                    appointments: {
                        create: {
                            userId: permission.user.id,
                            title: appointment.title || "Initial Consultation",
                            startTime: new Date(appointment.startTime),
                            endTime: new Date(new Date(appointment.startTime).getTime() + 30 * 60000), // Default 30 min duration
                            description: appointment.remark,
                        }
                    }
                } : {})
            },
        });

        return NextResponse.json(lead, { status: 201 });
    } catch (error: any) {
        console.error('Create lead error details:', error);
        return NextResponse.json({
            message: 'Failed to create lead',
            error: error.message
        }, { status: 500 });
    }
});
