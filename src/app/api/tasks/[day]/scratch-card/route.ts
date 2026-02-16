import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ day: string }> },
) {
  const { error, user } = await requireAuth()
  if (error) return error

  const { day } = await params
  const taskDay = parseInt(day, 10)
  if (isNaN(taskDay)) {
    return NextResponse.json({ error: 'Invalid day' }, { status: 400 })
  }

  const card = await prisma.scratchCard.findUnique({
    where: { userId_taskDay: { userId: user!.id, taskDay } },
  })

  if (!card) {
    return NextResponse.json({ hasCard: false })
  }

  if (!card.isScratched) {
    return NextResponse.json({ hasCard: true, isScratched: false })
  }

  return NextResponse.json({
    hasCard: true,
    isScratched: true,
    isWinner: card.isWinner,
    prizeName: card.prizeName,
  })
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ day: string }> },
) {
  const { error, user } = await requireAuth()
  if (error) return error

  const { day } = await params
  const taskDay = parseInt(day, 10)
  if (isNaN(taskDay)) {
    return NextResponse.json({ error: 'Invalid day' }, { status: 400 })
  }

  const card = await prisma.scratchCard.findUnique({
    where: { userId_taskDay: { userId: user!.id, taskDay } },
  })

  if (!card) {
    return NextResponse.json({ error: 'No scratch card found' }, { status: 404 })
  }

  if (card.isScratched) {
    return NextResponse.json({ error: 'Already scratched' }, { status: 409 })
  }

  const updated = await prisma.scratchCard.update({
    where: { id: card.id },
    data: { isScratched: true, scratchedAt: new Date() },
  })

  return NextResponse.json({
    isWinner: updated.isWinner,
    prizeName: updated.prizeName,
  })
}
