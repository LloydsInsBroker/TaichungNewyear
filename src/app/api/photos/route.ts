import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { addPoints } from '@/lib/points'
import { PointType } from '@prisma/client'
import { POINTS_PER_PHOTO } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const { error, user } = await requireAuth()
  if (error) return error

  try {
    const { gcsKey, imageUrl, caption } = await request.json()

    if (!gcsKey) {
      return NextResponse.json(
        { error: 'gcsKey is required' },
        { status: 400 },
      )
    }

    // Use proxy URL instead of public GCS URL
    const encodedKey = Buffer.from(gcsKey).toString('base64url')
    const proxyUrl = `/api/photos/serve/${encodedKey}`

    const photo = await prisma.photoUpload.create({
      data: {
        userId: user!.id,
        gcsKey,
        imageUrl: proxyUrl,
        caption: caption || null,
      },
    })

    const { newTicketsCount } = await addPoints(
      user!.id,
      POINTS_PER_PHOTO,
      PointType.PHOTO_UPLOAD,
      photo.id,
      '照片上傳',
    )

    return NextResponse.json({
      success: true,
      photo,
      points: POINTS_PER_PHOTO,
      newTickets: newTicketsCount,
    })
  } catch (err) {
    console.error('Failed to create photo upload:', err)
    return NextResponse.json(
      { error: 'Failed to create photo upload' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    const [photos, total] = await Promise.all([
      prisma.photoUpload.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.photoUpload.count(),
    ])

    return NextResponse.json({
      photos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('Failed to fetch photos:', err)
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 },
    )
  }
}
