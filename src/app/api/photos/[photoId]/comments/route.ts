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

  const comments = await prisma.photoComment.findMany({
    where: { photoId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          displayName: true,
          pictureUrl: true,
        },
      },
    },
  })

  return NextResponse.json({ comments })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  const { error, user } = await requireAuth()
  if (error) return error

  const { photoId } = await params
  const { text } = await request.json()

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: '留言不能為空' }, { status: 400 })
  }

  if (text.length > 500) {
    return NextResponse.json({ error: '留言不能超過 500 字' }, { status: 400 })
  }

  const comment = await prisma.photoComment.create({
    data: {
      photoId,
      userId: user!.id,
      text: text.trim(),
    },
    include: {
      user: {
        select: {
          displayName: true,
          pictureUrl: true,
        },
      },
    },
  })

  // Create notification for the photo uploader (if commenter !== uploader)
  const photo = await prisma.photoUpload.findUnique({
    where: { id: photoId },
    select: { userId: true },
  })

  if (photo && photo.userId !== user!.id) {
    await prisma.notification.create({
      data: {
        userId: photo.userId,
        type: 'PHOTO_COMMENT',
        message: `${comment.user.displayName} 在你的照片留了言`,
        photoId,
      },
    })
  }

  return NextResponse.json({ comment })
}
