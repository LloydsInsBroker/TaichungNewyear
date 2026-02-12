import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const transaction = await prisma.pointTransaction.findUnique({
    where: { id },
  })

  if (!transaction) {
    return NextResponse.json({ error: '找不到該筆積分紀錄' }, { status: 404 })
  }

  // Delete the transaction and subtract points from user in a single transaction
  await prisma.$transaction(async (tx) => {
    await tx.pointTransaction.delete({ where: { id } })
    await tx.user.update({
      where: { id: transaction.userId },
      data: { totalPoints: { decrement: transaction.amount } },
    })
  })

  return NextResponse.json({ success: true })
}
