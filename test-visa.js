const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const v = await prisma.visaApplication.findUnique({ where: { id: '0a7fc0ce-f5fc-4cba-a791-042300dd8753' }});
    console.log("Visa Application:", v);
    
    // Check applications count
    const apps = await prisma.universityApplication.findMany();
    console.log("Total Univ Apps count:", apps.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
