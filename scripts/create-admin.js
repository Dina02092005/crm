const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const name = 'Dinakar';
    const email = 'dinakar@example.com';
    const password = 'dinakar123';

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            name,
            passwordHash,
            role: 'ADMIN',
            isActive: true,
            emailVerified: new Date(),
        },
        create: {
            name,
            email,
            passwordHash,
            role: 'ADMIN',
            isActive: true,
            emailVerified: new Date(),
        },
    });

    console.log('Admin user created/updated:', JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified
    }, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
