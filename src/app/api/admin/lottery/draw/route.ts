import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { prizeId, count } = body as { prizeId: string; count: number }

  if (!prizeId || !count || count < 1) {
    return NextResponse.json(
      { error: 'prizeId and count (>= 1) are required' },
      { status: 400 },
    )
  }

  const prize = await prisma.prize.findUnique({ where: { id: prizeId } })
  if (!prize) {
    return NextResponse.json({ error: 'Prize not found' }, { status: 404 })
  }

  const remaining = prize.quantity - prize.awarded
  if (remaining <= 0) {
    return NextResponse.json({ error: 'No remaining prizes' }, { status: 400 })
  }

  const drawCount = Math.min(count, remaining)

  // Use raw query to randomly select tickets
  // Prisma doesn't support ORDER BY RANDOM natively, so we fetch IDs and pick randomly
  const activeTickets = await prisma.lotteryTicket.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  })

  if (activeTickets.length === 0) {
    return NextResponse.json({ error: 'No active tickets available' }, { status: 400 })
  }

  // Fisher-Yates shuffle and pick
  const shuffled = [...activeTickets]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const selectedIds = shuffled.slice(0, drawCount).map((t) => t.id)

  // Update winners and prize in a transaction
  const winners = await prisma.$transaction(async (tx) => {
    await tx.lotteryTicket.updateMany({
      where: { id: { in: selectedIds } },
      data: { status: 'WINNER', prizeId },
    })

    await tx.prize.update({
      where: { id: prizeId },
      data: { awarded: { increment: selectedIds.length } },
    })

    return tx.lotteryTicket.findMany({
      where: { id: { in: selectedIds } },
      include: {
        user: {
          select: { id: true, displayName: true, pictureUrl: true },
        },
      },
    })
  })

  return NextResponse.json({ winners })
}
