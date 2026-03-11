import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/permissions';

export const GET = withPermission('FILE_MANAGER', 'VIEW', async (req, { params, permission }) => {
    try {
        const { id } = await params;

        // Scope Check
        if (permission.scope !== 'ALL') {
            const student = await prisma.student.findUnique({
                where: { id },
                select: { counselorId: true, agentId: true, onboardedBy: true }
            });

            if (!student) {
                return NextResponse.json({ message: 'Student not found' }, { status: 404 });
            }

            if (permission.scope === 'ASSIGNED') {
                if (student.counselorId !== permission.user.id && student.agentId !== permission.user.id) {
                    return NextResponse.json({ error: "Forbidden: Student not assigned to you" }, { status: 403 });
                }
            } else if (permission.scope === 'OWN') {
                if (student.onboardedBy !== permission.user.id) {
                    return NextResponse.json({ error: "Forbidden: You did not onboard this student" }, { status: 403 });
                }
            }
        }

        const documents = await prisma.studentDocument.findMany({
            where: { studentId: id },
            include: {
                uploader: {
                    select: {
                        name: true,
                        role: true,
                    },
                },
                country: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Enrich with checklist isMandatory flag if checklistId exists
        const enriched = await Promise.all(
            documents.map(async (doc) => {
                let isMandatory = false;
                let documentFor = doc.country?.name || 'Application';
                if (doc.checklistId) {
                    const checklist = await prisma.applicationChecklist.findUnique({
                        where: { id: doc.checklistId },
                        select: { isMandatory: true, isEnquiryForm: true },
                    });
                    if (checklist) {
                        isMandatory = checklist.isMandatory;
                        documentFor = checklist.isEnquiryForm ? 'Enquiry' : 'Application';
                    }
                }
                return { ...doc, isMandatory, documentFor };
            })
        );

        return NextResponse.json(enriched);
    } catch (error: any) {
        console.error('FILE_MANAGER_DOCS_ERROR:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});
