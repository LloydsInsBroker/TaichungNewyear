import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const { error, user } = await requireAuth()
  if (error) return error

  const isAdmin = request.nextUrl.searchParams.get('admin') === '1'

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
    ...(isDev && !isAdmin && { isOpen: true, isClosed: false }),
    completed: completions.length > 0,
    completedAt: completions[0]?.completedAt?.toISOString(),
  }))

  return NextResponse.json({ tasks: result })
}
