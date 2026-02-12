import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const users = await prisma.user.findMany({
  select: { id: true, lineUserId: true, displayName: true, role: true, totalPoints: true },
})
console.table(users)
await prisma.$disconnect()
