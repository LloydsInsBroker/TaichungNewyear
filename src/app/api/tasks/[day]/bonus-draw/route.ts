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

  const draw = await prisma.bonusDraw.findFirst({
    where: { taskDay, isDonated: false },
    include: { winner: { select: { displayName: true, pictureUrl: true } } },
  })

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

  if (!draw) {
    return NextResponse.json({ hasDraw: false, donors })
  }

  return NextResponse.json({
    hasDraw: true,
    winner: { displayName: draw.winner.displayName, pictureUrl: draw.winner.pictureUrl },
    prizeName: draw.prizeName,
    donors,
  })
}
