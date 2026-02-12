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
