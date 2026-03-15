import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";
import { withPermission } from "@/lib/permissions";
import { notifyApplicationCreated } from "@/lib/lifecycle-notifications";
import { ApplicationStatus, VisaStatus } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/applications - List university applications
export const GET = withPermission('APPLICATIONS', 'VIEW', async (req, { permission }) => {
    try {
        const { user: sessionUser, scope } = permission;
        const session = { user: sessionUser };

        const { searchParams } = new URL(req.url);

        // Pagination
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        // Filters
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status");
        const countryId = searchParams.get("countryId");
        const assignedToId = searchParams.get("assignedToId");
        const assignedById = searchParams.get("assignedById");
        const intake = searchParams.get("intake");
        const applyLevel = searchParams.get("applyLevel");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const universityId = searchParams.get("universityId");
        const studentIdString = searchParams.get("studentId");

        const userRole = session.user.role as string;
        const userId = session.user.id as string;

        // If studentId is provided, returns all applications for that specific student
        if (studentIdString) {
            const studentAppWhere: any = { studentId: studentIdString };
            if (status && status !== "ALL") {
                const effectiveStatus = status === "APPROVED" ? "FINALIZED" : status;
                if (Object.values(ApplicationStatus).includes(effectiveStatus as any)) {
                    studentAppWhere.status = effectiveStatus;
                } else {
                    studentAppWhere.status = "INVALID_STATUS_FILTER";
                }
            }

            const [applications, total] = await Promise.all([
                prisma.universityApplication.findMany({
                    where: studentAppWhere,
                    include: {
                        student: {
                            select: {
                                id: true, name: true, email: true, phone: true, imageUrl: true, status: true, passportNo: true,
                            }
                        },
                        country: { select: { id: true, name: true } },
                        university: { select: { id: true, name: true } },
                        course: { select: { id: true, name: true } },
                        assignedBy: { select: { id: true, name: true, role: true } },
                        assignedTo: { select: { id: true, name: true, role: true } },
                        _count: {
                            select: { applicationNotes: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.universityApplication.count({ where: studentAppWhere })
            ]);

            return NextResponse.json({
                applications,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                }
            });
        }

        // --- Grouped By Student View ---

        const appWhere: Record<string, any> = {};
        let isAppStatus = false;
        let isVisaStatus = false;

        if (status && status !== "ALL") {
            const effectiveStatus = status === "APPROVED" ? "FINALIZED" : status;
            isAppStatus = Object.values(ApplicationStatus).includes(effectiveStatus as any);
            isVisaStatus = Object.values(VisaStatus).includes(effectiveStatus as any);

            if (isAppStatus) {
                appWhere.status = effectiveStatus;
            } else if (!isVisaStatus) {
                // If status is provided but not a valid ApplicationStatus or VisaStatus, 
                // we should filter for a non-existent status to return empty results.
                appWhere.status = "INVALID_STATUS_FILTER";
            }
        }
        if (countryId) appWhere.countryId = countryId;
        if (universityId) appWhere.universityId = universityId;
        if (assignedToId) appWhere.assignedToId = assignedToId;
        if (assignedById) appWhere.assignedById = assignedById;
        if (intake) appWhere.intake = { contains: intake, mode: "insensitive" };
        if (applyLevel) appWhere.applyLevel = applyLevel;

        if (dateFrom || dateTo) {
            appWhere.createdAt = {
                ...(dateFrom && { gte: new Date(dateFrom) }),
                ...(dateTo && { lte: new Date(dateTo) }),
            };
        }

        // RBAC Logic for applications (Dynamic scope-based)
        const secondaryIds = [userId];
        if (scope === 'OWN' || scope === 'ASSIGNED') {
            if (userRole === 'AGENT') {
                const agent = await prisma.agentProfile.findUnique({
                    where: { userId },
                    select: { id: true }
                });
                if (agent) {
                    const counselors = await prisma.counselorProfile.findMany({
                        where: { agentId: agent.id },
                        select: { userId: true }
                    });
                    secondaryIds.push(...counselors.map(c => c.userId));
                }
            } else if (userRole === 'COUNSELOR') {
                const counselor = await prisma.counselorProfile.findUnique({
                    where: { userId },
                    select: { agent: { select: { userId: true } } }
                });
                if (counselor?.agent?.userId) {
                    secondaryIds.push(counselor.agent.userId);
                }
            }

            // Apply restrictions to appWhere
            appWhere.OR = [
                { assignedToId: { in: secondaryIds } },
                { assignedById: { in: secondaryIds as any } },
                { agentId: { in: secondaryIds } },
                { counselorId: { in: secondaryIds } },
                { student: { onboardedBy: { in: secondaryIds } } },
                { student: { agentId: { in: secondaryIds } } },
                { student: { counselorId: { in: secondaryIds } } }
            ];
        }

        // Base where clause for STUDENTS
        const studentWhere: Record<string, any> = {};
        const conditions: any[] = [];

        // Condition A: Matching University Application
        if (!status || isAppStatus) {
            conditions.push({ applications: { some: appWhere } });
        }

        // Condition B: Matching Visa Application (only if status is provided and is a valid visa status)
        if (status && status !== "ALL" && isVisaStatus) {
            const visaWhere: any = { status: status as any };
            if (countryId) visaWhere.countryId = countryId;
            if (universityId) visaWhere.universityId = universityId;

            if (scope === 'OWN' || scope === 'ASSIGNED') {
                visaWhere.OR = [
                    { agentId: { in: secondaryIds } },
                    { counselorId: { in: secondaryIds } },
                    { assignedOfficerId: { in: secondaryIds } },
                    { student: { onboardedBy: { in: secondaryIds } } },
                    { student: { agentId: { in: secondaryIds } } },
                    { student: { counselorId: { in: secondaryIds } } }
                ];
            }
            conditions.push({ visaApplications: { some: visaWhere } });
        }

        if (conditions.length > 0) {
            if (conditions.length === 1) {
                Object.assign(studentWhere, conditions[0]);
            } else {
                studentWhere.OR = conditions;
            }
        } else {
            studentWhere.applications = { some: appWhere };
        }


        if (search) {
            studentWhere.AND = [
                {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                        { phone: { contains: search, mode: "insensitive" } },
                        { passportNo: { contains: search, mode: "insensitive" } },
                        {
                            applications: {
                                some: {
                                    OR: [
                                        { university: { name: { contains: search, mode: "insensitive" } } },
                                        { intendedCourse: { contains: search, mode: "insensitive" } },
                                    ]
                                }
                            }
                        }
                    ]
                }
            ];
        }

        if (userRole === 'STUDENT') {
            studentWhere.studentUserId = userId;
        } else if (userRole === 'AGENT') {
            const agent = await prisma.agentProfile.findUnique({
                where: { userId },
                select: { id: true }
            });
            const secondaryIds = [userId];
            if (agent) {
                const counselors = await prisma.counselorProfile.findMany({
                    where: { agentId: agent.id },
                    select: { userId: true }
                });
                secondaryIds.push(...counselors.map(c => c.userId));
            }
            studentWhere.onboardedBy = { in: secondaryIds };
        }

        console.log('DEBUG: Applications API', { userRole, userId, status, studentIdString });
        console.log('DEBUG: appWhere', JSON.stringify(appWhere, null, 2));
        console.log('DEBUG: studentWhere', JSON.stringify(studentWhere, null, 2));

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where: studentWhere,
                include: {
                    applications: {
                        where: appWhere,
                        include: {
                            country: { select: { id: true, name: true } },
                            university: { select: { id: true, name: true } },
                            course: { select: { id: true, name: true } },
                            assignedBy: { select: { id: true, name: true, role: true } },
                            assignedTo: { select: { id: true, name: true, role: true } },
                            _count: { select: { applicationNotes: true } }
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    visaApplications: {
                        where: {
                            ...(isVisaStatus && { status: status as any })
                        },
                        include: {
                            country: { select: { id: true, name: true } },
                            university: { select: { id: true, name: true } },
                            course: { select: { id: true, name: true } },
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    _count: {
                        select: { applications: true, visaApplications: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.student.count({ where: studentWhere }),
        ]);

        const mappedApplications = students.map(student => {
            const latestUniApp = student.applications[0];
            const latestVisaApp = student.visaApplications?.[0];

            // Prioritize status match. If we are filtering by status, find the one that matches.
            let displayApp = latestUniApp;
            if (status && latestVisaApp?.status === (status as any)) {
                displayApp = {
                    ...latestVisaApp,
                    status: latestVisaApp.status as any,
                    universityApplication: latestUniApp // keep ref if exists
                } as any;
            }

            if (!displayApp) return null;

            const isVisaStage = !!latestVisaApp;

            return {
                ...displayApp,
                isVisaStage,
                student: {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    phone: student.phone,
                    imageUrl: student.imageUrl,
                    status: student.status,
                    passportNo: student.passportNo,
                    _count: {
                        applications: student._count.applications,
                        visaApplications: student._count.visaApplications
                    }
                },
                _count: {
                    notes: (displayApp as any)._count?.applicationNotes || 0
                }
            };
        }).filter(Boolean);

        return NextResponse.json({
            applications: mappedApplications,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching applications:", error);
        return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
    }
});

// POST /api/applications 
export const POST = withPermission('APPLICATIONS', 'CREATE', async (req, { permission }) => {
    try {
        const { user: sessionUser } = permission;
        const session = { user: sessionUser };

        const body = await req.json();
        const { studentId, applications } = body;

        if (!studentId || !applications || !Array.isArray(applications) || applications.length === 0) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        if (session.user.role === 'AGENT') {
            const student = await prisma.student.findUnique({
                where: { id: studentId },
                select: { onboardedBy: true }
            });
            if (!student || student.onboardedBy !== (session.user as any).id) {
                return NextResponse.json({ error: "Unauthorized access to student" }, { status: 403 });
            }
        }

        // 1. Run the database transaction (only DB operations)
        const createdApplications = await prisma.$transaction(async (tx) => {
            const results = [];

            // Extract agent/counselor from first app
            const firstApp = applications[0];
            if (firstApp && (firstApp.agentId !== undefined || firstApp.counselorId !== undefined)) {
                await tx.student.update({
                    where: { id: studentId },
                    data: {
                        ...(firstApp.agentId !== undefined && { agentId: firstApp.agentId }),
                        ...(firstApp.counselorId !== undefined && { counselorId: firstApp.counselorId })
                    }
                });
            }

            for (const appData of applications) {
                const app = await tx.universityApplication.create({
                    data: {
                        studentId,
                        countryId: appData.countryId,
                        universityId: appData.universityId,
                        courseId: appData.courseId || null,
                        courseName: appData.courseName || null,
                        intake: appData.intake || null,
                        intendedCourse: appData.intendedCourse || null,
                        applyLevel: appData.applyLevel || null,
                        deadlineDate: appData.deadlineDate ? new Date(appData.deadlineDate) : null,
                        associateId: appData.associateId || null,
                        agentId: appData.agentId || null,
                        counselorId: appData.counselorId || null,
                        status: "PENDING"
                    },
                    include: {
                        student: { select: { name: true, leadId: true } },
                        university: { select: { name: true } }
                    }
                });
                
                if (app.student.leadId) {
                    await tx.leadActivity.create({
                        data: {
                            leadId: app.student.leadId,
                            userId: (session.user as any).id,
                            type: "STATUS_CHANGE",
                            content: `New application added for ${app.university.name} (${appData.intake || 'N/A'})`,
                        }
                    });
                }
                results.push(app);
            }
            return results;
        });

        // 2. Run side-effects outside the transaction to prevent hanging it
        for (const app of createdApplications) {
            await AuditLogService.log({
                userId: (session.user as any).id,
                action: "CREATED",
                module: "APPLICATIONS",
                entity: "UniversityApplication",
                entityId: app.id,
                newValues: app,
                metadata: { studentId, universityId: app.universityId }
            });

            // Lifecycle notification (Step 2)
            notifyApplicationCreated(app.id, (session.user as any).id).catch(
                (err) => console.error("[Lifecycle] notifyApplicationCreated failed:", err)
            );
        }

        return NextResponse.json(createdApplications, { status: 201 });
    } catch (error) {
        console.error("Error creating applications:", error);
        return NextResponse.json({ error: "Failed to create applications" }, { status: 500 });
    }
});
