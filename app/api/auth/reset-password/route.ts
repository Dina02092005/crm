import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { email, otp, newPassword } = await req.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || user.otp !== otp || (user.otpExpiresAt && user.otpExpiresAt < new Date())) {
            return NextResponse.json({ message: 'Invalid or expired OTP' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { email },
            data: {
                passwordHash,
                otp: null,
                otpExpiresAt: null,
            },
        });

        return NextResponse.json({ message: 'Password reset successful' }, { status: 200 });

    } catch (error) {
        console.error('Password reset error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
