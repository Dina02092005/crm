import { PrismaClient } from '../prisma/generated/client'


const prismaClientSingleton = () => {
  console.log("[PRISMA] Creating new PrismaClient instance...");
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export { prisma }
export * from '../prisma/generated/client'
export default prisma


if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
  console.log("[PRISMA] Reusing existing PrismaClient from globalThis");
}
