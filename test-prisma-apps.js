const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log("Starting query...");
    const appWhere = { status: { notIn: ['READY_FOR_VISA', 'DEFERRED', 'ENROLLED'] } };
    const studentWhere = { 
        applications: { 
            some: appWhere, 
            none: { status: { in: ['READY_FOR_VISA', 'DEFERRED', 'ENROLLED'] } } 
        } 
    };
    
    const count = await prisma.student.count({ where: studentWhere });
    console.log("Count with complex query:", count);
    
    const simpleCount = await prisma.student.count({
        where: {
            applications: { some: appWhere }
        }
    });

    console.log("Count with simple query:", simpleCount);

    const apps = await prisma.universityApplication.findMany({ select: { id: true, status: true, studentId: true }});
    console.log("All app statuses:", apps.map(a => a.status));
}
main().catch(console.error).finally(() => prisma.$disconnect());
