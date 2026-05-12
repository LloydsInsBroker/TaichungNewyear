import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { generateUploadUrl } from '@/lib/gcs'
import { ALLOWED_IMAGE_TYPES } from '@/lib/constants'

/**
 * Signed upload URL for AI design reference images.
 * Path: designs/refs/{userId}/{timestamp}-{random}.{ext}
 */
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

    const prefix = `designs/refs/${user!.id}`
    const { uploadUrl, gcsKey } = await generateUploadUrl(filename, contentType, prefix)

    return NextResponse.json({ uploadUrl, gcsKey })
  } catch (err) {
    console.error('Failed to generate design upload URL:', err)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 },
    )
  }
}
