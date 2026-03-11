import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, content } = body;

        const note = await prisma.note.findUnique({
            where: { id: params.id },
        });

        if (!note || note.userId !== session.user.id) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        const updatedNote = await prisma.note.update({
            where: { id: params.id },
            data: {
                title: title ?? note.title,
                content: content ?? note.content,
            },
        });

        return NextResponse.json(updatedNote);
    } catch (error) {
        console.error("[NOTE_PATCH]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const note = await prisma.note.findUnique({
            where: { id: params.id },
        });

        if (!note || note.userId !== session.user.id) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        await prisma.note.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: "Note deleted" });
    } catch (error) {
        console.error("[NOTE_DELETE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
