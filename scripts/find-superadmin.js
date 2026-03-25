const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findSuperAdmin() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        role: 'SUPER_ADMIN'
      }
    });
    console.log(JSON.stringify(user, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

findSuperAdmin();
