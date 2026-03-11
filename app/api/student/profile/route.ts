import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || session.user.role !== "STUDENT") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const student = await prisma.student.findUnique({
            where: { studentUserId: session.user.id },
            include: {
                user: { select: { name: true, email: true } },
                lead: {
                    include: {
                        academicDetails: true,
                        workExperience: true,
                    }
                }
            }
        });

        if (!student) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        return NextResponse.json(student);
    } catch (error) {
        console.error("[STUDENT_PROFILE_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || session.user.role !== "STUDENT") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            name, firstName, lastName, phone, gender, nationality,
            address, passportNo, passportIssueDate, passportExpiryDate,
            dateOfBirth
        } = body;

        const student = await prisma.student.findUnique({
            where: { studentUserId: session.user.id }
        });

        if (!student || !student.leadId) {
            return NextResponse.json({ error: "Student/Lead profile not found" }, { status: 404 });
        }

        const safeDate = (d: any) => {
            if (!d) return null;
            const date = new Date(d);
            return isNaN(date.getTime()) ? null : date;
        };

        // Update User and Lead associated with Student
        await prisma.$transaction([
            prisma.user.update({
                where: { id: session.user.id },
                data: { name: name || undefined }
            }),
            prisma.lead.update({
                where: { id: student.leadId },
                data: {
                    name: name || undefined,
                    firstName: firstName || undefined,
                    lastName: lastName || undefined,
                    phone: phone || undefined,
                    gender: gender || undefined,
                    nationality: nationality || undefined,
                    address: address || undefined,
                    passportNo: passportNo || undefined,
                    passportIssueDate: safeDate(passportIssueDate),
                    passportExpiryDate: safeDate(passportExpiryDate),
                    dateOfBirth: safeDate(dateOfBirth),
                }
            }),
            prisma.student.update({
                where: { id: student.id },
                data: {
                    name: name || undefined,
                    phone: phone || undefined,
                    passportNo: passportNo || undefined,
                    passportIssueDate: safeDate(passportIssueDate),
                    passportExpiryDate: safeDate(passportExpiryDate),
                }
            })
        ]);

        return NextResponse.json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error("[STUDENT_PROFILE_PATCH]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
