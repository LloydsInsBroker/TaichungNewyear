import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const taskDay = parseInt(request.nextUrl.searchParams.get('taskDay') ?? '', 10)
  if (isNaN(taskDay)) {
    return NextResponse.json({ error: 'taskDay is required' }, { status: 400 })
  }

  const cards = await prisma.scratchCard.findMany({
    where: { taskDay },
    include: { user: { select: { displayName: true } } },
  })

  const totalCards = cards.length
  const scratchedCount = cards.filter((c) => c.isScratched).length
  const winnerCards = cards.filter((c) => c.isWinner)
  const winners = winnerCards.map((c) => ({
    displayName: c.user.displayName,
    isScratched: c.isScratched,
    scratchedAt: c.scratchedAt,
    prizeName: c.prizeName,
  }))

  return NextResponse.json({
    totalCards,
    scratchedCount,
    winner: winners[0] ?? null,
    winners,
  })
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { taskDay, prizeName, winnerCount } = body as {
    taskDay: number
    prizeName: string
    winnerCount: number
  }

  if (!taskDay || !prizeName || !winnerCount) {
    return NextResponse.json({ error: 'taskDay, prizeName, winnerCount are required' }, { status: 400 })
  }

  // Check task is closed
  const task = await prisma.dailyTask.findUnique({ where: { day: taskDay } })
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }
  if (!task.isClosed) {
    return NextResponse.json({ error: 'Task must be closed first' }, { status: 400 })
  }

  // Check not already generated
  const existingCount = await prisma.scratchCard.count({ where: { taskDay } })
  if (existingCount > 0) {
    return NextResponse.json({ error: 'Scratch cards already generated for this day' }, { status: 409 })
  }

  // Find all users who completed this task
  const completions = await prisma.taskCompletion.findMany({
    where: { taskId: task.id },
    select: { userId: true },
  })

  const userIds = completions.map((c) => c.userId)
  if (userIds.length === 0) {
    return NextResponse.json({ error: 'No completions found' }, { status: 400 })
  }

  // Fisher-Yates shuffle to pick winners
  const shuffled = [...userIds]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const winnerIds = new Set(shuffled.slice(0, Math.min(winnerCount, shuffled.length)))

  // Create scratch cards in transaction
  const cards = await prisma.$transaction(
    userIds.map((userId) =>
      prisma.scratchCard.create({
        data: {
          userId,
          taskDay,
          isWinner: winnerIds.has(userId),
          prizeName: winnerIds.has(userId) ? prizeName : null,
        },
      })
    )
  )

  return NextResponse.json({
    generated: cards.length,
    winners: winnerIds.size,
    eligibleUsers: userIds.length,
  })
}
