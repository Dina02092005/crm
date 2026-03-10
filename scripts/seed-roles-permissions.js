const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '..', 'prisma', 'generated', 'client'));
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const PERMISSION_MODULES = ["LEADS", "STUDENTS", "APPLICATIONS", "VISA", "MASTERS", "ROLES"];
const PERMISSION_ACTIONS = ["VIEW", "CREATE", "EDIT", "DELETE", "DOWNLOAD", "PRINT", "APPROVE"];

async function main() {
    console.log('Seeding roles and permissions...');

    const roles = [
        {
            name: 'Super Admin',
            roleEnum: 'ADMIN',
            description: 'Full system control with all permissions',
            isSystem: true,
            permissions: PERMISSION_MODULES.map(module => ({
                module,
                actions: [...PERMISSION_ACTIONS],
                scope: 'ALL'
            }))
        },
        {
            name: 'Agent',
            roleEnum: 'AGENT',
            description: 'Agent access for lead management',
            isSystem: true,
            permissions: PERMISSION_MODULES.map(module => ({
                module,
                actions: ["VIEW", "CREATE", "EDIT"],
                scope: 'ASSIGNED'
            }))
        },
        {
            name: 'Counselor',
            roleEnum: 'COUNSELOR',
            description: 'Counselor access for student guidance',
            isSystem: true,
            permissions: PERMISSION_MODULES.map(module => ({
                module,
                actions: ["VIEW", "CREATE", "EDIT"],
                scope: 'ASSIGNED'
            }))
        },
        {
            name: 'Student',
            roleEnum: 'STUDENT',
            description: 'Student access for profile and applications',
            isSystem: true,
            permissions: PERMISSION_MODULES.map(module => ({
                module,
                actions: ["VIEW"],
                scope: 'OWN'
            }))
        }
    ];

    for (const roleData of roles) {
        const { permissions, roleEnum, ...roleFields } = roleData;

        // Note: Prisma models are lowercase in the generated client here
        const role = await prisma.userRole.upsert({
            where: { name: roleFields.name },
            update: {
                ...roleFields,
                permissions: {
                    deleteMany: {},
                    create: permissions
                }
            },
            create: {
                ...roleFields,
                permissions: {
                    create: permissions
                }
            }
        });
        console.log(`- Role seeded: ${role.name}`);

        if (roleFields.name === 'Super Admin') {
            const email = 'admin@example.com';
            const passwordHash = await bcrypt.hash('admin123', 10);
            await prisma.user.upsert({
                where: { email },
                update: {
                    name: 'Super Admin',
                    passwordHash,
                    role: roleEnum,
                    roleId: role.id,
                    isActive: true,
                    emailVerified: new Date()
                },
                create: {
                    email,
                    name: 'Super Admin',
                    passwordHash,
                    role: roleEnum,
                    roleId: role.id,
                    isActive: true,
                    emailVerified: new Date()
                }
            });
            console.log(`  - Admin user created: ${email} / admin123`);
        }
    }

    console.log('Seeding complete!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
