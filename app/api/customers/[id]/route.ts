import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/customers/[id] - Get customer details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                lead: {
                    include: {
                        activities: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                            orderBy: { createdAt: "desc" },
                            take: 20,
                        },
                        documents: true,
                        tasks: {
                            include: {
                                reminders: true,
                            },
                        },
                    },
                },
            },
        });

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error fetching customer:", error);
        return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
    }
}

// PATCH /api/customers/[id] - Update customer
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, email, phone } = body;

        const customer = await prisma.customer.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(email !== undefined && { email }),
                ...(phone && { phone }),
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

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error updating customer:", error);
        return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
    }
}

// DELETE /api/customers/[id] - Delete customer (Admin only)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can delete customers
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        await prisma.customer.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Customer deleted successfully" });
    } catch (error) {
        console.error("Error deleting customer:", error);
        return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
    }
}
