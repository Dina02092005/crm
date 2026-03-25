import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const name = process.argv[3]
  const password = process.argv[4]

  if (!email || !name || !password) {
    console.error('Usage: npx ts-node scripts/create-super-admin.ts <email> <name> <password>')
    process.exit(1)
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
        emailVerified: new Date(),
      },
    })
    
    console.log(`Successfully created SUPER_ADMIN user: ${user.name} (${user.email})`)
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('Error: A user with this email already exists.')
    } else {
      console.error('Error creating SUPER_ADMIN user:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
