import { PrismaClient } from '../prisma/generated/client_v2'


const prismaClientSingleton = () => {
  try {
    return new PrismaClient()
  } catch (error: any) {
    console.error('------- PRISMA INIT ERROR -------')
    console.error(error.message || error)
    console.error('--------------------------------')
    throw error
  }
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
