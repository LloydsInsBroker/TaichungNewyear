import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const bucket = process.env.GCS_BUCKET_NAME!

  // id is the gcsKey encoded as base64url
  let gcsKey: string
  try {
    gcsKey = Buffer.from(id, 'base64url').toString('utf-8')
  } catch {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  // Validate the key starts with "photos/"
  if (!gcsKey.startsWith('photos/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
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
        'Content-Type': metadata.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch (err) {
    console.error('Failed to serve photo:', err)
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 })
  }
}
