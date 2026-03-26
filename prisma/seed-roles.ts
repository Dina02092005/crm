import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Roles & Permissions seeding...');

    const modules = [
        "LEADS", "STUDENTS", "APPLICATIONS", "VISA", "AGENTS",
        "COUNSELORS", "REPORTS", "MASTER", "FILE_MANAGER",
        "ROLES", "NOTES", "FOLLOW_UPS"
    ];

    const actions = ["VIEW", "CREATE", "EDIT", "DELETE", "ASSIGN"];

    // 1. Create all Permissions
    console.log('Creating permissions...');
    const permissions: any = {};
    for (const module of modules) {
        for (const action of actions) {
            const name = `${action}_${module}`;
            const perm = await prisma.permission.upsert({
                where: { name },
                update: { module, action },
                create: { name, module, action }
            });
            permissions[name] = perm.id;
        }
    }

    // 2. Clear existing role permissions to start fresh (Optional but safer for seeding)
    // await prisma.rolePermission.deleteMany({});

    // 3. Define Roles and their Permissions
    const rolesData = [
        {
            name: 'SUPER_ADMIN',
            description: 'Full system access with all permissions.',
            isSystem: true,
            permissions: Object.keys(permissions) // Everything
        },
        {
            name: 'ADMIN',
            description: 'Administrative access to most modules.',
            isSystem: true,
            permissions: [
                ...actions.flatMap(a => [
                    `${a}_LEADS`, `${a}_STUDENTS`, `${a}_APPLICATIONS`,
                    `${a}_VISA`, `${a}_AGENTS`, `${a}_COUNSELORS`,
                    `${a}_REPORTS`, `${a}_MASTER`, `${a}_FILE_MANAGER`
                ])
            ]
        },
        {
            name: 'COUNSELOR',
            description: 'Counselor access for managing assigned leads and students.',
            isSystem: true,
            permissions: [
                "VIEW_LEADS", "CREATE_LEADS", "EDIT_LEADS",
                "VIEW_STUDENTS", "CREATE_STUDENTS", "EDIT_STUDENTS",
                "VIEW_APPLICATIONS", "CREATE_APPLICATIONS", "EDIT_APPLICATIONS",
                "VIEW_NOTES", "CREATE_NOTES", "EDIT_NOTES",
                "VIEW_FOLLOW_UPS", "CREATE_FOLLOW_UPS", "EDIT_FOLLOW_UPS"
            ]
        },
        {
            name: 'AGENT',
            description: 'Agent access for lead creation and tracking.',
            isSystem: true,
            permissions: [
                "CREATE_LEADS", "VIEW_LEADS", "EDIT_LEADS"
            ]
        },
        {
            name: 'STUDENT',
            description: 'Student access for tracking their own applications.',
            isSystem: true,
            permissions: [
                "VIEW_APPLICATIONS", "VIEW_VISA"
            ]
        }
    ];

    console.log('Creating roles and assigning permissions...');
    for (const roleData of rolesData) {
        const { permissions: rolePermNames, ...roleInfo } = roleData;

        const role = await prisma.userRole.upsert({
            where: { name: roleInfo.name },
            update: { description: roleInfo.description, isSystem: roleInfo.isSystem },
            create: roleInfo
        });

        // Assign permissions to role
        for (const permName of rolePermNames) {
            const permissionId = permissions[permName];
            if (permissionId) {
                await prisma.rolePermission.upsert({
                    where: {
                        roleId_permissionId: {
                            roleId: role.id,
                            permissionId: permissionId
                        }
                    },
                    update: {},
                    create: {
                        roleId: role.id,
                        permissionId: permissionId,
                        scope: roleInfo.name === 'SUPER_ADMIN' || roleInfo.name === 'ADMIN' ? 'ALL' : 'ASSIGNED'
                    }
                });
            }
        }
    }

    console.log('Roles & Permissions seeding completed!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
