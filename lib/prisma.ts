import { PrismaClient } from '../prisma/generated/client_v2'


const prismaClientSingleton = () => {
  console.log("[PRISMA] Creating new PrismaClient instance from client_v2...");
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export { prisma }
export * from '../prisma/generated/client_v2'
export default prisma


if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
  console.log("[PRISMA] Reusing existing PrismaClient from globalThis");
}
