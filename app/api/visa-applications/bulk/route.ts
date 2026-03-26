import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || !["ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        await prisma.visaApplication.deleteMany({
            where: { id: { in: ids } }
        });

        // Audit Logging (Optional) - Mimicking other bulk delete patterns
        // We could loop and log each, but for performance we might just log once.
        // Current pattern in leads/bulk does loop.
        
        return NextResponse.json({ message: `${ids.length} visa applications deleted successfully` });
    } catch (error) {
        console.error("Error bulk deleting visa applications:", error);
        return NextResponse.json({ error: "Failed to bulk delete visa applications" }, { status: 500 });
    }
}
