import { Storage } from '@google-cloud/storage'
import { UPLOAD_URL_EXPIRY_MINUTES, ALLOWED_IMAGE_TYPES, MAX_PHOTO_SIZE_MB } from './constants'

let storage: Storage | null = null

function getStorage(): Storage {
  if (!storage) {
    const privateKey = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n')

    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: privateKey,
      },
    })
  }
  return storage
}

export async function generateUploadUrl(
  filename: string,
  contentType: string,
): Promise<{ uploadUrl: string; gcsKey: string; publicUrl: string }> {
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    throw new Error(`Invalid content type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`)
  }

  const bucket = process.env.GCS_BUCKET_NAME!
  const timestamp = Date.now()
  const ext = filename.split('.').pop() || 'jpg'
  const gcsKey = `photos/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`

  const gcsStorage = getStorage()
  const [url] = await gcsStorage
    .bucket(bucket)
    .file(gcsKey)
    .getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + UPLOAD_URL_EXPIRY_MINUTES * 60 * 1000,
      contentType,
    })

  const publicUrl = `https://storage.googleapis.com/${bucket}/${gcsKey}`

  return { uploadUrl: url, gcsKey, publicUrl }
}
