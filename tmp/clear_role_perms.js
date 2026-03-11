const path = require('path');
const { PrismaClient } = require(path.join(process.cwd(), 'prisma', 'generated', 'client_v2'));
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Deleting all RolePermission entries...');
        await prisma.rolePermission.deleteMany({});
        console.log('Deleted successfully.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
