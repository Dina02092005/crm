import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || session.user.role !== "STUDENT") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { applicationId, note, attachmentUrl, attachmentName } = body;

        if (!applicationId || !note) {
            return NextResponse.json({ error: "ApplicationId and note are required" }, { status: 400 });
        }

        // Verify that this application belongs to the student
        const application = await prisma.universityApplication.findFirst({
            where: {
                id: applicationId,
                student: {
                    studentUserId: session.user.id
                }
            }
        });

        if (!application) {
            return NextResponse.json({ error: "Application not found or access denied" }, { status: 404 });
        }

        const newNote = await prisma.applicationNote.create({
            data: {
                applicationId,
                userId: session.user.id,
                note,
                attachmentUrl,
                attachmentName,
                type: "COMMENT"
            }
        });

        // Trigger notification for assigned agent/counselor
        // Using in-app notification first
        if (application.agentId) {
            await prisma.notification.create({
                data: {
                    userId: application.agentId,
                    title: "New Note from Student",
                    message: `Student added a comment to their application for ${applicationId}`,
                    type: "SYSTEM"
                }
            });
        }
        if (application.counselorId) {
            await prisma.notification.create({
                data: {
                    userId: application.counselorId,
                    title: "New Note from Student",
                    message: `Student added a comment to their application for ${applicationId}`,
                    type: "SYSTEM"
                }
            });
        }

        return NextResponse.json(newNote);

    } catch (error) {
        console.error("[STUDENT_NOTE_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
