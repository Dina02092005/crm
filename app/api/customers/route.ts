import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/customers - List all customers with filters
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const where: any = {};

        // Search by name, email, or phone
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ];
        }

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    lead: {
                        select: {
                            source: true,
                            temperature: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.customer.count({ where }),
        ]);

        return NextResponse.json({
            customers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching customers:", error);
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
}

// POST /api/customers - Create new customer (manual entry)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, email, phone, leadId } = body;

        if (!name || !phone) {
            return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
        }

        // If leadId is provided, check if it exists and is not already converted
        if (leadId) {
            const existingCustomer = await prisma.customer.findUnique({
                where: { leadId },
            });

            if (existingCustomer) {
                return NextResponse.json({ error: "Lead already converted to customer" }, { status: 400 });
            }
        }

        const customer = await prisma.customer.create({
            data: {
                name,
                email,
                phone,
                leadId: leadId || null,
                onboardedBy: session.user.id,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        console.error("Error creating customer:", error);
        return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }
}
