
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { S3UploadService } from "@/lib/s3";

export const dynamic = 'force-dynamic';

// GET /api/upload/config - Get upload configuration
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const s3Service = new S3UploadService();

        // This effectively returns the config used by the service (though some is private/internal)
        // We can expose safe config details here for client-side validation
        const config = {
            maxFileSize: 10 * 1024 * 1024,
            allowedMimeTypes: [
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
                'application/pdf',
                'video/mp4', 'video/quicktime', 'video/x-msvideo'
            ]
        };

        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/upload - Upload file(s)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const s3Service = new S3UploadService();
        const result = await s3Service.uploadFile(file);

        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json({ error: result.error || "Upload failed" }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/upload - Delete file
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { fileUrl } = await req.json();

        if (!fileUrl) {
            return NextResponse.json({ error: "File URL is required" }, { status: 400 });
        }

        const s3Service = new S3UploadService();
        const success = await s3Service.deleteFile(fileUrl);

        if (success) {
            return NextResponse.json({ message: "File deleted successfully" });
        } else {
            return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
        }
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
