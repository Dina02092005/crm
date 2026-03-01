import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const now = new Date();
    const dateRange = { gte: from, lte: now };

    console.log("Testing groupBy with relation filter...");
    try {
        const results = await prisma.lead.groupBy({
            by: ["source"],
            where: {
                createdAt: dateRange,
                assignments: {
                    some: {
                        assignedTo: { in: [] } // Empty list for test
                    }
                }
            },
            _count: { source: true }
        });
        console.log("Success:", results);
    } catch (err: any) {
        console.error("FAILED as expected or not:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
