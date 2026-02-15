import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { error, user } = await requireAuth()
  if (error) return error

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.notification.count({
      where: { userId: user!.id, isRead: false },
    }),
  ])

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(request: NextRequest) {
  const { error, user } = await requireAuth()
  if (error) return error

  const body = await request.json()

  if (body.markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: user!.id, isRead: false },
      data: { isRead: true },
    })
  } else if (body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, userId: user!.id },
      data: { isRead: true },
    })
  }

  return NextResponse.json({ success: true })
}
