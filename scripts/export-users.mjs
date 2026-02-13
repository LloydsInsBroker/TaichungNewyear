import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'

const prisma = new PrismaClient()

const users = await prisma.user.findMany({
  orderBy: { createdAt: 'asc' },
  include: {
    pointTransactions: true,
    lotteryTickets: true,
    _count: {
      select: {
        taskCompletions: true,
        photoUploads: true,
      },
    },
  },
})

const exportData = {
  exportedAt: new Date().toISOString(),
  totalUsers: users.length,
  users: users.map((u) => ({
    id: u.id,
    lineUserId: u.lineUserId,
    displayName: u.displayName,
    pictureUrl: u.pictureUrl,
    role: u.role,
    totalPoints: u.totalPoints,
    createdAt: u.createdAt.toISOString(),
    taskCompletions: u._count.taskCompletions,
    photoUploads: u._count.photoUploads,
    lotteryTickets: u.lotteryTickets.map((t) => ({
      ticketNumber: t.ticketNumber,
      status: t.status,
    })),
    pointTransactions: u.pointTransactions.map((t) => ({
      amount: t.amount,
      type: t.type,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    })),
  })),
}

const filename = `scripts/users-backup-${new Date().toISOString().slice(0, 10)}.json`
writeFileSync(filename, JSON.stringify(exportData, null, 2), 'utf-8')

console.log(`Exported ${users.length} users to ${filename}`)
console.log('\nUser list:')
users.forEach((u, i) => {
  console.log(`  ${i + 1}. ${u.displayName} | points: ${u.totalPoints} | role: ${u.role} | created: ${u.createdAt.toISOString()}`)
})

await prisma.$disconnect()
