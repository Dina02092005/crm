import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ message: 'Email and OTP are required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (user.otp !== otp) {
            return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
        }

        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
            return NextResponse.json({ message: 'OTP expired' }, { status: 400 });
        }

        await prisma.user.update({
            where: { email },
            data: {
                emailVerified: new Date(),
                otp: null,
                otpExpiresAt: null,
            },
        });

        return NextResponse.json({ message: 'Email verified successfully' }, { status: 200 });

    } catch (error) {
        console.error('OTP Verification error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
