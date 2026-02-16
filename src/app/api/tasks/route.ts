import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'

export async function GET() {
  const { error, user } = await requireAuth()
  if (error) return error

  const tasks = await prisma.dailyTask.findMany({
    orderBy: { day: 'asc' },
    include: {
      completions: {
        where: { userId: user!.id },
        select: { completedAt: true },
      },
    },
  })

  const isDev = process.env.NODE_ENV === 'development'
  const result = tasks.map(({ completions, ...task }) => ({
    ...task,
    ...(isDev && { isOpen: true, isClosed: false }),
    completed: completions.length > 0,
    completedAt: completions[0]?.completedAt?.toISOString(),
  }))

  return NextResponse.json({ tasks: result })
}
