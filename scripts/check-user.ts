import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUser() {
    // Manually specify direct URL to bypass potential pooler issues
    const directPrisma = new PrismaClient({
        datasources: {
            db: {
                url: "postgresql://postgres.hrfrncafiviqtozutfhg:Raji%40944420%25@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
            }
        }
    });

    const users = await directPrisma.user.findMany();
    console.log('Total users found:', users.length);
    users.forEach(u => console.log(`- ${u.email} (${u.role})`));

    if (users.length === 0) {
        console.log('Database is empty. Please run seeding.');
    }

    await prisma.$disconnect();
}

checkUser().catch(console.error);
