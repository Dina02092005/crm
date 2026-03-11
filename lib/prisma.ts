import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  console.log(`[PRISMA] [PID: ${process.pid}] NEW PrismaClient created`);
  return new PrismaClient({
    log: ['error', 'warn'],
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

let prisma: ReturnType<typeof prismaClientSingleton>;

if (globalThis.prismaGlobal) {
  prisma = globalThis.prismaGlobal;
  console.log(`[PRISMA] [PID: ${process.pid}] EXISITING client reused from globalThis`);
} else {
  prisma = prismaClientSingleton();
  if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prisma;
  }
}

export default prisma
export { prisma }

// Re-export types and enums
export * from '@prisma/client'
