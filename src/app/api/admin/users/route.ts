import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { addPoints } from '@/lib/points'
import { PointType } from '@prisma/client'

export async function GET(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''

  const where = search
    ? { displayName: { contains: search, mode: 'insensitive' as const } }
    : {}

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          taskCompletions: true,
          photoUploads: true,
          lotteryTickets: true,
        },
      },
    },
  })

  return NextResponse.json({ users })
}

export async function PATCH(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { userId, role, adjustPoints } = body as {
    userId: string
    role?: 'USER' | 'ADMIN'
    adjustPoints?: number
  }

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (role) {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    })
  }

  if (typeof adjustPoints === 'number' && adjustPoints !== 0) {
    await addPoints(userId, adjustPoints, PointType.ADMIN_ADJUSTMENT, undefined, '管理員調整')
  }

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          taskCompletions: true,
          photoUploads: true,
          lotteryTickets: true,
        },
      },
    },
  })

  return NextResponse.json({ user: updatedUser })
}
