import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  const { error } = await requireAuth()
  if (error) return error

  const { photoId } = await params

  const photo = await prisma.photoUpload.findUnique({
    where: { id: photoId },
    include: {
      user: {
        select: {
          displayName: true,
          pictureUrl: true,
        },
      },
      _count: {
        select: { comments: true },
      },
    },
  })

  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
  }

  return NextResponse.json(photo)
}
