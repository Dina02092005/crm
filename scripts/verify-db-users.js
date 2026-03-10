const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking users in database...");
    const users = await prisma.user.findMany({
        select: {
            email: true,
            role: true,
            isActive: true
        }
    });

    let output = "";
    if (users.length === 0) {
        output = "No users found in the database.";
    } else {
        output = `Found ${users.length} users:\n`;
        users.forEach(user => {
            output += `- Email: ${user.email}, Role: ${user.role}, Active: ${user.isActive}\n`;
        });
    }

    fs.writeFileSync(path.join(__dirname, 'db_users_output.txt'), output);
    console.log("Output written to scripts/db_users_output.txt");
}

main()
    .catch(e => {
        const errOutput = "Error checking users: " + e.message;
        fs.writeFileSync(path.join(__dirname, 'db_users_output.txt'), errOutput);
        console.error(errOutput);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
