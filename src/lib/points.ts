import { prisma } from './prisma'
import { PointType } from '@prisma/client'
import { POINTS_PER_LOTTERY_TICKET } from './constants'
import { v4 as uuidv4 } from 'uuid'

export async function addPoints(
  userId: string,
  amount: number,
  type: PointType,
  referenceId?: string,
  description?: string,
) {
  return prisma.$transaction(async (tx) => {
    // Create point transaction
    const pointTx = await tx.pointTransaction.create({
      data: {
        userId,
        amount,
        type,
        referenceId,
        description,
      },
    })

    // Update user total points
    const user = await tx.user.update({
      where: { id: userId },
      data: { totalPoints: { increment: amount } },
    })

    // Check if user earned new lottery tickets
    const previousPoints = user.totalPoints - amount
    const previousTickets = Math.floor(previousPoints / POINTS_PER_LOTTERY_TICKET)
    const currentTickets = Math.floor(user.totalPoints / POINTS_PER_LOTTERY_TICKET)
    const newTickets = currentTickets - previousTickets

    // Generate lottery tickets
    if (newTickets > 0) {
      const tickets = []
      for (let i = 0; i < newTickets; i++) {
        tickets.push({
          userId,
          ticketNumber: generateTicketNumber(),
        })
      }
      await tx.lotteryTicket.createMany({ data: tickets })
    }

    return { pointTx, user, newTicketsCount: Math.max(0, newTickets) }
  })
}

function generateTicketNumber(): string {
  const uuid = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase()
  return `CNY-${uuid}`
}
