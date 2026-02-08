import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/mail';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // For security reasons, don't reveal if user exists or not
            return NextResponse.json({ message: 'If an account exists, an OTP has been sent.' }, { status: 200 });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.user.update({
            where: { email },
            data: {
                otp,
                otpExpiresAt,
            },
        });

        await sendOTPEmail(email, otp);

        return NextResponse.json({ message: 'If an account exists, an OTP has been sent.' }, { status: 200 });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
