/**
 * 設定 GCS Bucket 為公開可讀
 * 用法: npx tsx scripts/set-gcs-public.ts
 */

import { Storage } from '@google-cloud/storage'
import 'dotenv/config'

async function main() {
  const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
      client_email: process.env.GCS_CLIENT_EMAIL!,
      private_key: process.env.GCS_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
  })

  const bucketName = process.env.GCS_BUCKET_NAME!
  console.log(`設定 Bucket "${bucketName}" 為公開可讀...`)

  const bucket = storage.bucket(bucketName)

  // 讓所有物件公開可讀
  await bucket.makePublic()

  console.log('✅ Bucket 已設為公開可讀！')
  console.log(`   所有圖片可透過 https://storage.googleapis.com/${bucketName}/... 存取`)
}

main().catch((err) => {
  console.error('❌ 錯誤:', err.message)

  if (err.message.includes('uniform bucket-level access')) {
    console.log('\n💡 如果啟用了 Uniform Bucket-Level Access，請改用以下方式：')
    console.log('   前往 GCS Console → Bucket → Permissions')
    console.log('   → Grant Access → allUsers → Storage Object Viewer')
  }

  process.exit(1)
})
