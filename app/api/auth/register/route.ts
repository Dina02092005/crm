import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/mail';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { email, password, name } = await req.json();

        if (!email || !password || !name) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                otp,
                otpExpiresAt,
                role: 'EMPLOYEE',
            },
        });

        await sendOTPEmail(email, otp);

        return NextResponse.json({
            message: 'User registered. Please verify your email with the OTP sent.',
            userId: user.id
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
