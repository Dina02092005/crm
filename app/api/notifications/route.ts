import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 20, // Limit to recent 20
        });

        const unreadCount = await prisma.notification.count({
            where: {
                userId: session.user.id,
                isRead: false,
            },
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Fetch notifications error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, markAllRead } = body;

        if (markAllRead) {
            await prisma.notification.updateMany({
                where: {
                    userId: session.user.id,
                    isRead: false,
                },
                data: {
                    isRead: true,
                },
            });
            return NextResponse.json({ message: 'All notifications marked as read' });
        }

        if (id) {
            await prisma.notification.update({
                where: {
                    id,
                    userId: session.user.id, // Ensure ownership
                },
                data: {
                    isRead: true,
                },
            });
            return NextResponse.json({ message: 'Notification marked as read' });
        }

        return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    } catch (error) {
        console.error('Update notification error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
