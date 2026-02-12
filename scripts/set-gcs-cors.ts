/**
 * 設定 GCS Bucket CORS
 * 用法: npx tsx scripts/set-gcs-cors.ts
 */

import { Storage } from '@google-cloud/storage'
import 'dotenv/config'

const BUCKET_NAME = process.env.GCS_BUCKET_NAME!
const PRIVATE_KEY = process.env.GCS_PRIVATE_KEY!.replace(/\\n/g, '\n')

async function main() {
  const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
      client_email: process.env.GCS_CLIENT_EMAIL!,
      private_key: PRIVATE_KEY,
    },
  })

  const corsConfig = [
    {
      origin: ['http://localhost:3000'],
      method: ['PUT', 'GET'],
      responseHeader: ['Content-Type'],
      maxAgeSeconds: 3600,
    },
  ]

  // 如果有正式域名，加到這裡
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('localhost')) {
    corsConfig[0].origin.push(process.env.NEXTAUTH_URL)
  }

  console.log(`Setting CORS on bucket: ${BUCKET_NAME}`)
  console.log(`Allowed origins: ${corsConfig[0].origin.join(', ')}`)

  await storage.bucket(BUCKET_NAME).setCorsConfiguration(corsConfig)

  console.log('✅ CORS 設定完成！')

  // 驗證
  const [metadata] = await storage.bucket(BUCKET_NAME).getMetadata()
  console.log('\n目前 CORS 設定:')
  console.log(JSON.stringify(metadata.cors, null, 2))
}

main().catch((err) => {
  console.error('❌ 錯誤:', err.message)
  process.exit(1)
})
