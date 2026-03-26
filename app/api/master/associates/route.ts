import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const where = {
            role: {
                in: ["AGENT", "COUNSELOR", "EMPLOYEE", "ADMIN"] as any[]
            },
            isActive: true,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } }
                ]
            })
        };

        const [associates, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    role: true,
                    email: true
                },
                orderBy: { name: "asc" },
                skip,
                take: limit
            }),
            prisma.user.count({ where })
        ]);

        return NextResponse.json({
            associates,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching associates:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
