import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

/** Returns a single design generation record (must be owned by the requester). */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireAuth()
  if (error) return error

  const record = await prisma.designGeneration.findUnique({
    where: { id: params.id },
  })

  if (!record) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (record.userId !== user!.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const proxyUrl = record.resultGcsKey
    ? `/api/design/serve/${Buffer.from(record.resultGcsKey).toString('base64url')}`
    : null

  return NextResponse.json({
    id: record.id,
    status: record.status,
    conditions: record.conditions,
    referenceKeys: record.referenceKeys,
    imageUrl: proxyUrl,
    errorMessage: record.errorMessage,
    createdAt: record.createdAt,
  })
}
