const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '..', 'prisma', 'generated', 'client'));
const prisma = new PrismaClient();

async function main() {
    console.log("Connecting to database...");
    const users = await prisma.user.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
    });
    console.log("Recent 20 Users:");
    users.forEach(u => console.log(`${u.id}: ${u.email} (${u.role})`));

    const students = await prisma.student.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
    });
    console.log("\nRecent 10 Students:");
    students.forEach(s => console.log(`${s.id}: ${s.email} (User ID: ${s.studentUserId})`));
}

main().catch(err => {
    console.error("Script failed:", err);
    process.exit(1);
}).finally(() => prisma.$disconnect());
