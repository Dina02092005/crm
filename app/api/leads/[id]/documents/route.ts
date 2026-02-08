import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LeadActivityType, DocumentType } from '@prisma/client';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

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
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const documentType = formData.get('type') as DocumentType || DocumentType.OTHER;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const path = join(process.cwd(), 'public', 'uploads', fileName);
        await writeFile(path, buffer);

        const fileUrl = `/uploads/${fileName}`;

        const document = await prisma.$transaction(async (tx) => {
            const newDoc = await tx.leadDocument.create({
                data: {
                    leadId: id,
                    uploadedBy: session.user.id,
                    type: documentType,
                    fileName: file.name,
                    fileUrl,
                }
            });

            await tx.leadActivity.create({
                data: {
                    leadId: id,
                    userId: session.user.id,
                    type: LeadActivityType.DOCUMENT_UPLOAD,
                    content: `Document uploaded: ${file.name} (${documentType})`
                }
            });

            return newDoc;
        });

        return NextResponse.json(document, { status: 201 });
    } catch (error) {
        console.error('Upload document error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

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
        const documents = await prisma.leadDocument.findMany({
            where: { leadId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error('Fetch documents error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
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
        const documentId = searchParams.get('documentId');

        if (!documentId) {
            return NextResponse.json({ message: 'Document ID required' }, { status: 400 });
        }

        const document = await prisma.leadDocument.findUnique({
            where: { id: documentId }
        });

        if (!document) {
            return NextResponse.json({ message: 'Document not found' }, { status: 404 });
        }

        // Delete file from storage
        try {
            const filePath = join(process.cwd(), 'public', document.fileUrl);
            await unlink(filePath);
        } catch (error) {
            console.error('File deletion error:', error);
        }

        // Delete from database
        await prisma.$transaction(async (tx) => {
            await tx.leadDocument.delete({
                where: { id: documentId }
            });

            await tx.leadActivity.create({
                data: {
                    leadId: id,
                    userId: session.user.id,
                    type: LeadActivityType.NOTE,
                    content: `Document deleted: ${document.fileName}`
                }
            });
        });

        return NextResponse.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete document error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

