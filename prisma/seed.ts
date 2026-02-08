import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('admin123', 10);

    const admin = await (prisma.user as any).upsert({
        where: { email: 'admin@taxiby.com' },
        update: {
            passwordHash: passwordHash,
            role: 'ADMIN',
            emailVerified: new Date(),
        },
        create: {
            email: 'admin@taxiby.com',
            name: 'System Admin',
            passwordHash: passwordHash,
            role: 'ADMIN',
            isActive: true,
            emailVerified: new Date(),
        },
    });

    console.log({ admin });

    const sampleLeads = [
        {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '9876543210',
            source: 'WEBSITE_1',
            status: 'NEW',
            temperature: 'WARM',
            message: 'Looking for a premium ride service.'
        },
        {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '9888888888',
            source: 'WEBSITE_2',
            status: 'IN_PROGRESS',
            temperature: 'HOT',
            message: 'Need a corporate account for my team.'
        },
        {
            name: 'Robert Brown',
            email: 'robert@example.com',
            phone: '9777777777',
            source: 'WEBSITE_3',
            status: 'NEW',
            temperature: 'COLD',
            message: 'General inquiry about pricing.'
        }
    ];

    for (const leadData of sampleLeads) {
        const existing = await prisma.lead.findFirst({
            where: { phone: leadData.phone }
        });

        if (!existing) {
            await (prisma.lead as any).create({
                data: leadData,
            });
        }
    }

    console.log('Sample leads seeded successfully');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
