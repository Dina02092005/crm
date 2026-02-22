import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const documents = await prisma.studentDocument.findMany({
            where: { studentId: id },
            include: {
                uploader: { select: { name: true } },
                country: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(documents);
    } catch (error: any) {
        console.error('GET_STUDENT_DOCS_ERROR:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
}

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

        // Always resolve the uploader ID from the DB by email.
        // session.user.id can be stale/wrong if the session was created before
        // the userId JWT field was correctly populated.
        if (!session.user?.email) {
            return NextResponse.json({ message: 'Unauthorized: no email in session' }, { status: 401 });
        }
        const sessionUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });
        if (!sessionUser) {
            return NextResponse.json({ message: 'Uploader account not found' }, { status: 400 });
        }
        const uploaderId = sessionUser.id;

        // Verify student exists
        const student = await prisma.student.findUnique({ where: { id } });
        if (!student) {
            return NextResponse.json({ message: 'Student not found' }, { status: 404 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const documentName = formData.get('documentName') as string;
        const countryId = formData.get('countryId') as string | null;
        const checklistId = formData.get('checklistId') as string | null;

        if (!file || !documentName) {
            return NextResponse.json({ message: 'File and document name are required' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ message: 'Invalid file type. Allowed: pdf, xls, xlsx, doc, docx, jpeg, jpg, png' }, { status: 400 });
        }

        // Validate file size (3MB max)
        const maxSize = 3 * 1024 * 1024; // 3MB
        if (file.size > maxSize) {
            return NextResponse.json({ message: 'File size exceeds 3MB limit' }, { status: 400 });
        }

        // Save file
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split('.').pop();
        const uniqueFileName = `${randomUUID()}.${ext}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'student-documents');

        await mkdir(uploadDir, { recursive: true });
        await writeFile(join(uploadDir, uniqueFileName), fileBuffer);

        const fileUrl = `/uploads/student-documents/${uniqueFileName}`;

        const doc = await prisma.studentDocument.create({
            data: {
                studentId: id,
                uploadedBy: uploaderId,
                fileName: file.name,
                fileUrl,
                documentName,
                countryId: countryId || null,
                checklistId: checklistId || null,
            },
            include: {
                uploader: { select: { name: true } },
                country: { select: { name: true } },
            },
        });

        return NextResponse.json(doc, { status: 201 });
    } catch (error: any) {
        console.error('POST_STUDENT_DOC_ERROR:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const docId = searchParams.get('docId');

        if (!docId) {
            return NextResponse.json({ message: 'Document ID required' }, { status: 400 });
        }

        // Check ownership or admin
        const doc = await prisma.studentDocument.findUnique({ where: { id: docId } });
        if (!doc) {
            return NextResponse.json({ message: 'Document not found' }, { status: 404 });
        }

        if (doc.studentId !== id) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        await prisma.studentDocument.delete({ where: { id: docId } });

        return NextResponse.json({ message: 'Document deleted' });
    } catch (error: any) {
        console.error('DELETE_STUDENT_DOC_ERROR:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
}
