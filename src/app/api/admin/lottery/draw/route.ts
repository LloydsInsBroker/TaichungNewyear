import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'

// DELETE: Reset all draw results
export async function DELETE() {
  const { error } = await requireAdmin()
  if (error) return error

  const result = await prisma.$transaction(async (tx) => {
    const winnerCount = await tx.lotteryTicket.count({
      where: { status: 'WINNER' },
    })

    await tx.lotteryTicket.updateMany({
      where: { status: 'WINNER' },
      data: { status: 'ACTIVE', prizeId: null },
    })

    await tx.prize.updateMany({
      data: { awarded: 0 },
    })

    return { resetTickets: winnerCount }
  })

  return NextResponse.json({
    success: true,
    resetTickets: result.resetTickets,
  })
}

// GET: Preview - pick a random winner without saving (for animation)
export async function GET(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const prizeId = searchParams.get('prizeId')

  if (!prizeId) {
    return NextResponse.json({ error: '請提供 prizeId' }, { status: 400 })
  }

  const prize = await prisma.prize.findUnique({ where: { id: prizeId } })
  if (!prize) {
    return NextResponse.json({ error: 'Prize not found' }, { status: 404 })
  }

  const remaining = prize.quantity - prize.awarded
  if (remaining <= 0) {
    return NextResponse.json({ error: '此獎品已全部抽完' }, { status: 400 })
  }

  // Exclude users who already won this prize
  const existingWinners = await prisma.lotteryTicket.findMany({
    where: { prizeId, status: 'WINNER' },
    select: { userId: true },
    distinct: ['userId'],
  })
  const excludedUserIds = Array.from(new Set(existingWinners.map((w) => w.userId)))

  // Get active tickets with user info, excluding previous winners
  const activeTickets = await prisma.lotteryTicket.findMany({
    where: {
      status: 'ACTIVE',
      ...(excludedUserIds.length > 0 ? { userId: { notIn: excludedUserIds } } : {}),
    },
    select: {
      id: true,
      userId: true,
      ticketNumber: true,
      user: { select: { id: true, displayName: true, pictureUrl: true } },
    },
  })

  if (activeTickets.length === 0) {
    return NextResponse.json(
      { error: excludedUserIds.length > 0 ? '沒有可抽獎的券（已排除此獎品的中獎者）' : '沒有可抽獎的券' },
      { status: 400 },
    )
  }

  // Deduplicate users for animation display
  const userMap = new Map<string, { displayName: string; pictureUrl: string | null }>()
  for (const t of activeTickets) {
    if (!userMap.has(t.userId)) {
      userMap.set(t.userId, { displayName: t.user.displayName, pictureUrl: t.user.pictureUrl })
    }
  }
  const eligibleUsers = Array.from(userMap.values())

  // Fisher-Yates shuffle and pick one ticket
  const shuffled = [...activeTickets]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const picked = shuffled[0]

  return NextResponse.json({
    eligibleUsers,
    selectedTicket: {
      id: picked.id,
      ticketNumber: picked.ticketNumber,
      user: picked.user,
    },
  })
}

// POST: Confirm a specific ticket as winner
export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { prizeId, ticketId } = body as { prizeId: string; ticketId: string }

  if (!prizeId || !ticketId) {
    return NextResponse.json(
      { error: 'prizeId and ticketId are required' },
      { status: 400 },
    )
  }

  const prize = await prisma.prize.findUnique({ where: { id: prizeId } })
  if (!prize) {
    return NextResponse.json({ error: 'Prize not found' }, { status: 404 })
  }

  const remaining = prize.quantity - prize.awarded
  if (remaining <= 0) {
    return NextResponse.json({ error: '此獎品已全部抽完' }, { status: 400 })
  }

  // Verify the ticket is still ACTIVE
  const ticket = await prisma.lotteryTicket.findUnique({ where: { id: ticketId } })
  if (!ticket || ticket.status !== 'ACTIVE') {
    return NextResponse.json({ error: '此抽獎券已不可用' }, { status: 400 })
  }

  // Confirm winner in a transaction
  const winner = await prisma.$transaction(async (tx) => {
    await tx.lotteryTicket.update({
      where: { id: ticketId },
      data: { status: 'WINNER', prizeId },
    })

    await tx.prize.update({
      where: { id: prizeId },
      data: { awarded: { increment: 1 } },
    })

    return tx.lotteryTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, displayName: true, pictureUrl: true } },
      },
    })
  })

  return NextResponse.json({ winner })
}
