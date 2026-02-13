import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const users = await prisma.user.findMany({
  select: { id: true, lineUserId: true, displayName: true, totalPoints: true, createdAt: true },
  orderBy: { displayName: 'asc' },
})

// Group by displayName
const groups = {}
for (const u of users) {
  if (!groups[u.displayName]) groups[u.displayName] = []
  groups[u.displayName].push(u)
}

// Find duplicates
const duplicates = Object.entries(groups).filter(([, list]) => list.length > 1)

if (duplicates.length === 0) {
  console.log('No duplicate display names found.')
} else {
  console.log(`Found ${duplicates.length} duplicate name(s):\n`)
  for (const [name, list] of duplicates) {
    console.log(`"${name}" (${list.length} accounts):`)
    for (const u of list) {
      console.log(`  id: ${u.id} | lineUserId: ${u.lineUserId} | points: ${u.totalPoints} | created: ${u.createdAt.toISOString()}`)
    }
    console.log()
  }
}

console.log(`\nTotal users: ${users.length}`)
await prisma.$disconnect()
