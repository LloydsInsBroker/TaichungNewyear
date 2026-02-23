import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { POINTS_PER_LOTTERY_TICKET } from '@/lib/constants'
import { v4 as uuidv4 } from 'uuid'

function generateTicketNumber(): string {
  const uuid = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase()
  return `CNY-${uuid}`
}

export async function POST() {
  const { error } = await requireAdmin()
  if (error) return error

  // Get all users with their current ticket counts
  const users = await prisma.user.findMany({
    select: {
      id: true,
      displayName: true,
      totalPoints: true,
      _count: { select: { lotteryTickets: true } },
    },
  })

  let totalGenerated = 0
  const details: { displayName: string; generated: number }[] = []

  for (const user of users) {
    const expectedTickets = Math.floor(user.totalPoints / POINTS_PER_LOTTERY_TICKET)
    const actualTickets = user._count.lotteryTickets
    const missing = expectedTickets - actualTickets

    if (missing > 0) {
      const tickets = []
      for (let i = 0; i < missing; i++) {
        tickets.push({
          userId: user.id,
          ticketNumber: generateTicketNumber(),
        })
      }
      await prisma.lotteryTicket.createMany({ data: tickets })
      totalGenerated += missing
      details.push({ displayName: user.displayName, generated: missing })
    }
  }

  return NextResponse.json({
    totalGenerated,
    usersSettled: users.length,
    details,
  })
}
