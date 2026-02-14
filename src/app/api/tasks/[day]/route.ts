import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth-utils'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ day: string }> },
) {
  const { error, user } = await requireAuth()
  if (error) return error

  const { day: dayParam } = await params
  const day = parseInt(dayParam, 10)
  if (isNaN(day)) {
    return NextResponse.json({ error: 'Invalid day parameter' }, { status: 400 })
  }

  const task = await prisma.dailyTask.findUnique({
    where: { day },
    include: {
      completions: {
        include: {
          user: {
            select: { displayName: true, pictureUrl: true },
          },
        },
        orderBy: { completedAt: 'asc' },
      },
    },
  })

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const { completions, ...taskData } = task
  const myCompletion = completions.find((c) => c.userId === user!.id)
  return NextResponse.json({
    ...taskData,
    completed: !!myCompletion,
    completedAt: myCompletion?.completedAt?.toISOString(),
    completions: completions.map((c) => ({
      displayName: c.user.displayName,
      pictureUrl: c.user.pictureUrl,
      completedAt: c.completedAt.toISOString(),
    })),
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ day: string }> },
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { day: dayParam } = await params
  const day = parseInt(dayParam, 10)
  if (isNaN(day)) {
    return NextResponse.json({ error: 'Invalid day parameter' }, { status: 400 })
  }

  const body = await request.json()
  const { title, description, points, taskConfig, isOpen } = body as {
    title?: string
    description?: string
    points?: number
    taskConfig?: unknown
    isOpen?: boolean
  }

  const existing = await prisma.dailyTask.findUnique({ where: { day } })
  if (!existing) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const updated = await prisma.dailyTask.update({
    where: { day },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(points !== undefined && { points }),
      ...(taskConfig !== undefined && { taskConfig: taskConfig as any }),
      ...(isOpen !== undefined && { isOpen }),
    },
  })

  return NextResponse.json(updated)
}
