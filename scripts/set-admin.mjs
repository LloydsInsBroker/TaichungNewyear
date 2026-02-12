import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const user = await prisma.user.update({
  where: { id: 'cmljm47dx0000w60sxqwe0kjd' },
  data: { role: 'ADMIN' },
  select: { id: true, displayName: true, role: true },
})
console.log('Updated:', user)
await prisma.$disconnect()
