import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { generateUploadUrl } from '@/lib/gcs'
import { ALLOWED_IMAGE_TYPES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const { error, user } = await requireAuth()
  if (error) return error

  try {
    const { filename, contentType } = await request.json()

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'filename and contentType are required' },
        { status: 400 },
      )
    }

    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid content type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}` },
        { status: 400 },
      )
    }

    const { uploadUrl, gcsKey, publicUrl } = await generateUploadUrl(filename, contentType)

    return NextResponse.json({ uploadUrl, gcsKey, publicUrl })
  } catch (err) {
    console.error('Failed to generate upload URL:', err)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 },
    )
  }
}
