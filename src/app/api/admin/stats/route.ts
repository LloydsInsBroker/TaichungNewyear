import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const [
    totalUsers,
    totalTaskCompletions,
    totalPhotoUploads,
    pointsResult,
    activeLotteryTickets,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.taskCompletion.count(),
    prisma.photoUpload.count(),
    prisma.pointTransaction.aggregate({ _sum: { amount: true } }),
    prisma.lotteryTicket.count({ where: { status: 'ACTIVE' } }),
  ])

  return NextResponse.json({
    totalUsers,
    totalTaskCompletions,
    totalPhotoUploads,
    totalPointsAwarded: pointsResult._sum.amount ?? 0,
    activeLotteryTickets,
  })
}
