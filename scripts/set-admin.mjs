import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Usage: node scripts/set-admin.mjs [displayName]
// If no displayName provided, lists all users
const targetName = process.argv[2]

if (!targetName) {
  const users = await prisma.user.findMany({
    select: { id: true, displayName: true, role: true, lineUserId: true },
    orderBy: { createdAt: 'desc' },
  })
  console.log('All users:')
  users.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.displayName} | role: ${u.role} | id: ${u.id} | lineUserId: ${u.lineUserId}`)
  })
  console.log(`\nUsage: node scripts/set-admin.mjs "顯示名稱"`)
} else {
  const user = await prisma.user.findFirst({
    where: { displayName: targetName },
    orderBy: { createdAt: 'desc' }, // pick latest if duplicates
  })

  if (!user) {
    console.log(`找不到使用者: "${targetName}"`)
  } else {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
      select: { id: true, displayName: true, role: true, lineUserId: true },
    })
    console.log(`已設為管理員:`, updated)
  }
}

await prisma.$disconnect()
