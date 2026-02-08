
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { S3UploadService } from "@/lib/s3";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body;
        try {
            body = await req.json();
        } catch (e: any) {
            return NextResponse.json({ error: "Invalid JSON format", details: e.message }, { status: 400 });
        }

        const { fileName, fileType } = body;

        if (!fileName || !fileType) {
            return NextResponse.json({ error: "fileName and fileType are required" }, { status: 400 });
        }

        const s3Service = new S3UploadService();
        const result = await s3Service.getPresignedUploadUrl(fileName, fileType);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Presigned URL Error:", error);
        console.error("Error detailed:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
