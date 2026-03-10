console.log("Current DATABASE_URL:", process.env.DATABASE_URL);
const { PrismaClient } = require("./prisma/generated/client");
const prisma = new PrismaClient();
prisma.website.findMany().then(() => console.log("Success")).catch(e => console.error("Initialization Error:", e.name, e.message)).finally(() => prisma.$disconnect());
