import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import { addPoints } from '@/lib/points'
import { POINTS_PER_TASK } from '@/lib/constants'
import { PointType } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ day: string }> },
) {
  const { error, user } = await requireAuth()
  if (error) return error

  const { day: dayParam } = await params
  const day = parseInt(dayParam, 10)
  if (isNaN(day)) {
    return NextResponse.json({ error: 'Invalid day parameter' }, { status: 400 })
  }

  const task = await prisma.dailyTask.findUnique({ where: { day } })
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (!task.isOpen) {
    return NextResponse.json({ error: '此任務尚未開放' }, { status: 403 })
  }

  if (task.isClosed) {
    return NextResponse.json({ error: '此任務已截止' }, { status: 403 })
  }

  const existing = await prisma.taskCompletion.findUnique({
    where: { userId_taskId: { userId: user!.id, taskId: task.id } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Task already completed' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const config = task.taskConfig as Record<string, unknown> | null

  if (task.taskType === 'QUIZ') {
    const correctAnswer = config?.correctAnswer
    if (body.answer == null || body.answer !== correctAnswer) {
      return NextResponse.json({ error: 'Incorrect answer' }, { status: 400 })
    }
  }

  if (task.taskType === 'TEXT_ANSWER') {
    const minLength = (config?.minLength as number) ?? 1
    if (!body.answer || typeof body.answer !== 'string' || body.answer.trim().length < minLength) {
      return NextResponse.json(
        { error: `Answer must be at least ${minLength} characters` },
        { status: 400 },
      )
    }
  }

  const completion = await prisma.taskCompletion.create({
    data: {
      userId: user!.id,
      taskId: task.id,
      answer: body.answer ?? null,
    },
  })

  const result = await addPoints(
    user!.id,
    POINTS_PER_TASK,
    PointType.TASK_COMPLETION,
    completion.id,
    task.title,
  )

  return NextResponse.json({
    success: true,
    points: POINTS_PER_TASK,
    newTickets: result.newTicketsCount,
  })
}
