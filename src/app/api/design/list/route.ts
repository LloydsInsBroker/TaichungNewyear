import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

/**
 * List the current user's recent design generations.
 * Returns: { items: [{ id, status, createdAt, thumbnailUrl, style, colorScheme, errorMessage }] }
 */
export async function GET(request: NextRequest) {
  const { error, user } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

  const rows = await prisma.designGeneration.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      status: true,
      resultGcsKey: true,
      errorMessage: true,
      conditions: true,
      createdAt: true,
    },
  })

  const items = rows.map((r) => {
    const c = (r.conditions as any) || {}
    return {
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      errorMessage: r.errorMessage,
      style: typeof c.style === 'string' ? c.style : null,
      colorScheme: typeof c.colorScheme === 'string' ? c.colorScheme : null,
      thumbnailUrl: r.resultGcsKey
        ? `/api/design/serve/${Buffer.from(r.resultGcsKey).toString('base64url')}`
        : null,
    }
  })

  return NextResponse.json({ items })
}
