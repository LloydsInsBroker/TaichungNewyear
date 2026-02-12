import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { error, user } = await requireAuth()
  if (error) return error

  const dbUser = await prisma.user.findUnique({
    where: { id: user!.id },
    select: {
      id: true,
      displayName: true,
      pictureUrl: true,
      totalPoints: true,
      role: true,
    },
  })

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Gather stats
  const [taskCompletionCount, photoUploadCount, lotteryTicketCount] =
    await Promise.all([
      prisma.taskCompletion.count({ where: { userId: user!.id } }),
      prisma.photoUpload.count({ where: { userId: user!.id } }),
      prisma.lotteryTicket.count({ where: { userId: user!.id } }),
    ])

  // Recent point transactions (last 10)
  const recentTransactions = await prisma.pointTransaction.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      amount: true,
      type: true,
      description: true,
      createdAt: true,
    },
  })

  // Lottery tickets with status
  const lotteryTickets = await prisma.lotteryTicket.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      ticketNumber: true,
      status: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    user: dbUser,
    stats: {
      taskCompletionCount,
      photoUploadCount,
      lotteryTicketCount,
    },
    recentTransactions,
    lotteryTickets,
  })
}
