const path = require('path');
const { PrismaClient } = require(path.join(__dirname, 'prisma', 'generated', 'client'));
const prisma = new PrismaClient();
prisma.website.findMany().then(() => console.log("success")).catch(console.error).finally(() => prisma.$disconnect());
