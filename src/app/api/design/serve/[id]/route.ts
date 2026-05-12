import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { requireAuth } from '@/lib/auth-utils'

let storage: Storage | null = null

function getStorage(): Storage {
  if (!storage) {
    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL!,
        private_key: process.env.GCS_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      },
    })
  }
  return storage
}

/**
 * Proxy for design-related GCS objects (results + reference images).
 * Path: /api/design/serve/{base64url(gcsKey)}
 * Auth: requires login. For reference images, key must be under the caller's own prefix.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireAuth()
  if (error) return error

  const bucket = process.env.GCS_BUCKET_NAME!
  let gcsKey: string
  try {
    gcsKey = Buffer.from(params.id, 'base64url').toString('utf-8')
  } catch {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  // Path must be under designs/ — and reference uploads are scoped to the owner.
  if (!gcsKey.startsWith('designs/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }
  if (gcsKey.startsWith('designs/refs/')) {
    const expectedPrefix = `designs/refs/${user!.id}/`
    if (!gcsKey.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  // For results, the [id] route already checks ownership when returning the URL,
  // but defense in depth: also restrict by user prefix.
  if (gcsKey.startsWith('designs/results/')) {
    const expectedPrefix = `designs/results/${user!.id}/`
    if (!gcsKey.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  try {
    const file = getStorage().bucket(bucket).file(gcsKey)
    const [exists] = await file.exists()
    if (!exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const [metadata] = await file.getMetadata()
    const [buffer] = await file.download()

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': metadata.contentType || 'image/png',
        'Cache-Control': 'private, max-age=86400, immutable',
      },
    })
  } catch (err) {
    console.error('Failed to serve design asset:', err)
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 })
  }
}
