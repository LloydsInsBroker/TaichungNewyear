import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const prizes = await prisma.prize.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { tickets: true } },
    },
  })

  return NextResponse.json({ prizes })
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { name, description, quantity } = body as {
    name: string
    description?: string
    quantity: number
  }

  if (!name || !quantity || quantity < 1) {
    return NextResponse.json(
      { error: '請提供獎品名稱和數量（至少 1）' },
      { status: 400 },
    )
  }

  const prize = await prisma.prize.create({
    data: {
      name,
      description: description || null,
      quantity,
    },
    include: {
      _count: { select: { tickets: true } },
    },
  })

  return NextResponse.json({ prize })
}

export async function DELETE(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: '請提供獎品 ID' }, { status: 400 })
  }

  const prize = await prisma.prize.findUnique({ where: { id } })
  if (!prize) {
    return NextResponse.json({ error: '找不到該獎品' }, { status: 404 })
  }

  if (prize.awarded > 0) {
    return NextResponse.json(
      { error: '該獎品已有中獎者，無法刪除' },
      { status: 400 },
    )
  }

  await prisma.prize.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
