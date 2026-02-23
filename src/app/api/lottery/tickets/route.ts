import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'

export async function GET() {
  const { error, user } = await requireAuth()
  if (error) return error

  const users = await prisma.user.findMany({
    orderBy: [
      { totalPoints: 'desc' },
      { createdAt: 'asc' },
    ],
    select: {
      id: true,
      displayName: true,
      pictureUrl: true,
      totalPoints: true,
      _count: {
        select: {
          lotteryTickets: true,
        },
      },
    },
  })

  const list = users.map((u, index) => ({
    rank: index + 1,
    displayName: u.displayName,
    pictureUrl: u.pictureUrl,
    totalPoints: u.totalPoints,
    ticketCount: u._count.lotteryTickets,
    isCurrentUser: u.id === user!.id,
  }))

  const me = list.find((u) => u.isCurrentUser)

  return NextResponse.json({ users: list, myTicketCount: me?.ticketCount ?? 0 })
}
