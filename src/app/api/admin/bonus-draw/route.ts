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

  const task = await prisma.dailyTask.findUnique({ where: { day: taskDay } })
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  // Get eligible users (all who completed this task)
  const completions = await prisma.taskCompletion.findMany({
    where: { taskId: task.id },
    include: { user: { select: { displayName: true, pictureUrl: true } } },
  })
  const eligibleUsers = completions.map((c) => ({
    displayName: c.user.displayName,
    pictureUrl: c.user.pictureUrl,
  }))

  // Check current (non-donated) draw
  const draw = await prisma.bonusDraw.findFirst({
    where: { taskDay, isDonated: false },
    include: { winner: { select: { displayName: true, pictureUrl: true } } },
  })

  // Get donated draws
  const donated = await prisma.bonusDraw.findMany({
    where: { taskDay, isDonated: true },
    include: { winner: { select: { displayName: true, pictureUrl: true } } },
    orderBy: { createdAt: 'asc' },
  })
  const donors = donated.map((d) => ({
    displayName: d.winner.displayName,
    pictureUrl: d.winner.pictureUrl,
    prizeName: d.prizeName,
  }))

  if (draw) {
    return NextResponse.json({
      hasDraw: true,
      winner: { displayName: draw.winner.displayName, pictureUrl: draw.winner.pictureUrl },
      prizeName: draw.prizeName,
      eligibleUsers,
      donors,
    })
  }

  return NextResponse.json({ hasDraw: false, eligibleUsers, donors })
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { taskDay, prizeName } = body as { taskDay: number; prizeName: string }

  if (!taskDay || !prizeName) {
    return NextResponse.json({ error: 'taskDay and prizeName are required' }, { status: 400 })
  }

  const task = await prisma.dailyTask.findUnique({ where: { day: taskDay } })
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }
  if (!task.isClosed) {
    return NextResponse.json({ error: 'Task must be closed first' }, { status: 400 })
  }

  // Check if already confirmed (non-donated)
  const existing = await prisma.bonusDraw.findFirst({ where: { taskDay, isDonated: false } })
  if (existing) {
    return NextResponse.json({ error: '此天已確認過抽獎結果' }, { status: 409 })
  }

  // Get all completers, exclude donated winners
  const donated = await prisma.bonusDraw.findMany({
    where: { taskDay, isDonated: true },
    select: { winnerId: true },
  })
  const donorIds = donated.map((d) => d.winnerId)

  const completions = await prisma.taskCompletion.findMany({
    where: {
      taskId: task.id,
      ...(donorIds.length > 0 && { userId: { notIn: donorIds } }),
    },
    include: { user: { select: { id: true, displayName: true, pictureUrl: true } } },
  })

  if (completions.length === 0) {
    return NextResponse.json({ error: '沒有可抽獎的參與者了' }, { status: 400 })
  }

  // Random pick
  const winnerIdx = Math.floor(Math.random() * completions.length)
  const winner = completions[winnerIdx].user

  return NextResponse.json({
    winner: { id: winner.id, displayName: winner.displayName, pictureUrl: winner.pictureUrl },
    prizeName,
    totalEligible: completions.length,
  })
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { taskDay, winnerId, prizeName } = body as { taskDay: number; winnerId: string; prizeName: string }

  if (!taskDay || !winnerId || !prizeName) {
    return NextResponse.json({ error: 'taskDay, winnerId, and prizeName are required' }, { status: 400 })
  }

  // Check if already confirmed (non-donated)
  const existing = await prisma.bonusDraw.findFirst({ where: { taskDay, isDonated: false } })
  if (existing) {
    return NextResponse.json({ error: '此天已確認過抽獎結果' }, { status: 409 })
  }

  const draw = await prisma.bonusDraw.create({
    data: { taskDay, winnerId, prizeName },
    include: { winner: { select: { displayName: true, pictureUrl: true } } },
  })

  return NextResponse.json({
    success: true,
    winner: { displayName: draw.winner.displayName, pictureUrl: draw.winner.pictureUrl },
  })
}

// PUT: Mark current winner as donated, allowing re-draw
export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { taskDay } = body as { taskDay: number }

  if (!taskDay) {
    return NextResponse.json({ error: 'taskDay is required' }, { status: 400 })
  }

  const existing = await prisma.bonusDraw.findFirst({ where: { taskDay, isDonated: false } })
  if (!existing) {
    return NextResponse.json({ error: '此天尚無已確認的抽獎結果' }, { status: 404 })
  }

  await prisma.bonusDraw.update({
    where: { id: existing.id },
    data: { isDonated: true },
  })

  return NextResponse.json({ success: true })
}
