import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const notes = await prisma.note.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json(notes);
    } catch (error) {
        console.error("[NOTES_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, content } = body;

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const note = await prisma.note.create({
            data: {
                userId: session.user.id,
                title: title || "",
                content,
            },
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error("[NOTES_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
