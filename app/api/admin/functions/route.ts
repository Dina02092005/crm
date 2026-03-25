import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const MODELS = {
    COUNTRIES: 'country',
    WEBSITES: 'website',
    QUALIFICATIONS: 'qualification',
    APPLY_LEVELS: 'applyLevel',
    APP_STATUS_MASTER: 'applicationStatusMaster',
    VISA_STATUS_MASTER: 'visaStatusMaster',
    USER_ROLES: 'userRole',
};

export async function GET() {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [
            countries,
            websites,
            qualifications,
            applyLevels,
            appStatuses,
            visaStatuses,
            roles
        ] = await Promise.all([
            prisma.country.findMany({ select: { id: true, name: true, isActive: true }, orderBy: { name: 'asc' } }),
            prisma.website.findMany({ select: { id: true, name: true, isActive: true }, orderBy: { name: 'asc' } }),
            prisma.qualification.findMany({ select: { id: true, name: true, isActive: true }, orderBy: { name: 'asc' } }),
            prisma.applyLevel.findMany({ select: { id: true, name: true, isActive: true }, orderBy: { name: 'asc' } }),
            prisma.applicationStatusMaster.findMany({ select: { id: true, name: true, isActive: true }, orderBy: { name: 'asc' } }),
            prisma.visaStatusMaster.findMany({ select: { id: true, name: true, isActive: true }, orderBy: { name: 'asc' } }),
            prisma.userRole.findMany({ select: { id: true, name: true, isActive: true, isSystem: true }, orderBy: { name: 'asc' } }),
        ]);

        return NextResponse.json({
            countries,
            websites,
            qualifications,
            applyLevels,
            appStatuses,
            visaStatuses,
            roles
        });
    } catch (error) {
        console.error("Error fetching system functions:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { model, id, isActive } = await req.json();

        if (!model || !id || isActive === undefined) {
             return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const prismaModel = (prisma as any)[MODELS[model as keyof typeof MODELS]];
        if (!prismaModel) {
            return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
        }

        // Prevent deactivating critical system roles if needed
        if (model === 'USER_ROLES') {
            const role = await prisma.userRole.findUnique({ where: { id } });
            if (role?.isSystem && role.name === 'Super Admin' && !isActive) {
                return NextResponse.json({ error: 'Cannot deactivate Super Admin role' }, { status: 400 });
            }
        }

        const result = await prismaModel.update({
            where: { id },
            data: { isActive }
        });

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
                entity: model,
                entityId: id,
                module: 'SETTINGS',
                metadata: { model, id, isActive }
            }
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating system function:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
