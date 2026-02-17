import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ day: string }> },
) {
  const { error } = await requireAuth()
  if (error) return error

  const { day } = await params
  const taskDay = parseInt(day, 10)
  if (isNaN(taskDay)) {
    return NextResponse.json({ error: 'Invalid day' }, { status: 400 })
  }

  const draw = await prisma.bonusDraw.findUnique({
    where: { taskDay },
    include: { winner: { select: { displayName: true, pictureUrl: true } } },
  })

  if (!draw) {
    return NextResponse.json({ hasDraw: false })
  }

  return NextResponse.json({
    hasDraw: true,
    winner: { displayName: draw.winner.displayName, pictureUrl: draw.winner.pictureUrl },
    prizeName: draw.prizeName,
  })
}
