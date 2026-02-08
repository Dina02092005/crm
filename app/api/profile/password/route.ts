import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const { currentPassword, newPassword } = data;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ message: 'New password must be at least 6 characters' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user || !user.passwordHash) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ message: 'Incorrect current password' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                passwordHash: hashedPassword,
            },
        });

        return NextResponse.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
