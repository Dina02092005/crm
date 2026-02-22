import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readFile } from 'fs/promises';
import { join, basename } from 'path';
import { existsSync } from 'fs';
import JSZip from 'jszip';

// GET /api/file-manager/download?file=/uploads/student-documents/xxx.pdf&name=Passport.pdf
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !['ADMIN', 'MANAGER'].includes(session.user?.role)) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const fileUrl = searchParams.get('file');
        const downloadName = searchParams.get('name') || 'document';

        if (!fileUrl) {
            return NextResponse.json({ message: 'file param required' }, { status: 400 });
        }

        // Security: only allow files from our uploads directory
        if (!fileUrl.startsWith('/uploads/student-documents/')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const filePath = join(process.cwd(), 'public', fileUrl);
        if (!existsSync(filePath)) {
            return NextResponse.json({ message: 'File not found' }, { status: 404 });
        }

        const fileBuffer = await readFile(filePath);
        const ext = fileUrl.split('.').pop()?.toLowerCase() || '';
        const contentType = getContentType(ext);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadName)}"`,
                'Content-Length': fileBuffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error('FILE_MANAGER_DOWNLOAD_ERROR:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST /api/file-manager/download — body: { files: [{url, name}] }
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !['ADMIN', 'MANAGER'].includes(session.user?.role)) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const files: { url: string; name: string }[] = body.files || [];

        if (!files.length) {
            return NextResponse.json({ message: 'No files provided' }, { status: 400 });
        }

        // Validate all paths
        for (const f of files) {
            if (!f.url.startsWith('/uploads/student-documents/')) {
                return NextResponse.json({ message: 'Forbidden file path' }, { status: 403 });
            }
        }

        // Dynamically import JSZip (installed below)
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (const f of files) {
            const filePath = join(process.cwd(), 'public', f.url);
            if (existsSync(filePath)) {
                const buf = await readFile(filePath);
                // Avoid duplicate names in zip
                const safeName = f.name || basename(f.url);
                zip.file(safeName, buf);
            }
        }

        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

        return new NextResponse(zipBuffer, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="student-documents.zip"`,
                'Content-Length': zipBuffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error('FILE_MANAGER_ZIP_ERROR:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

function getContentType(ext: string): string {
    const map: Record<string, string> = {
        pdf: 'application/pdf',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    return map[ext] || 'application/octet-stream';
}
