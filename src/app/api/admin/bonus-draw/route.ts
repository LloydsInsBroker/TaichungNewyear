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

  // Check existing draw
  const draw = await prisma.bonusDraw.findUnique({
    where: { taskDay },
    include: { winner: { select: { displayName: true, pictureUrl: true } } },
  })

  if (draw) {
    return NextResponse.json({
      hasDraw: true,
      winner: { displayName: draw.winner.displayName, pictureUrl: draw.winner.pictureUrl },
      prizeName: draw.prizeName,
      eligibleUsers,
    })
  }

  return NextResponse.json({ hasDraw: false, eligibleUsers })
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

  // Check if already confirmed
  const existing = await prisma.bonusDraw.findUnique({ where: { taskDay } })
  if (existing) {
    return NextResponse.json({ error: '此天已確認過抽獎結果' }, { status: 409 })
  }

  // Get all completers
  const completions = await prisma.taskCompletion.findMany({
    where: { taskId: task.id },
    include: { user: { select: { id: true, displayName: true, pictureUrl: true } } },
  })

  if (completions.length === 0) {
    return NextResponse.json({ error: 'No completions found' }, { status: 400 })
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

  // Check if already confirmed
  const existing = await prisma.bonusDraw.findUnique({ where: { taskDay } })
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
