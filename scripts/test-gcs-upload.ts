/**
 * GCS 上傳測試腳本
 * 用法: npx tsx scripts/test-gcs-upload.ts [圖片路徑]
 * 範例: npx tsx scripts/test-gcs-upload.ts ./test.jpg
 *
 * 如果不提供圖片路徑，會自動建立一個小型測試圖片
 */

import { Storage } from '@google-cloud/storage'
import * as fs from 'fs'
import * as path from 'path'
import 'dotenv/config'

// ---- 環境變數檢查 ----
const required = ['GCS_PROJECT_ID', 'GCS_BUCKET_NAME', 'GCS_CLIENT_EMAIL', 'GCS_PRIVATE_KEY']
const missing = required.filter((k) => !process.env[k])
if (missing.length > 0) {
  console.error('❌ 缺少環境變數:', missing.join(', '))
  console.error('   請確認 .env 檔案已正確設定')
  process.exit(1)
}

const PROJECT_ID = process.env.GCS_PROJECT_ID!
const BUCKET_NAME = process.env.GCS_BUCKET_NAME!
const CLIENT_EMAIL = process.env.GCS_CLIENT_EMAIL!
const PRIVATE_KEY = process.env.GCS_PRIVATE_KEY!.replace(/\\n/g, '\n')

async function main() {
  console.log('🔧 GCS 上傳測試')
  console.log('─'.repeat(40))
  console.log(`   Project:  ${PROJECT_ID}`)
  console.log(`   Bucket:   ${BUCKET_NAME}`)
  console.log(`   Account:  ${CLIENT_EMAIL}`)
  console.log('')

  // 1. 建立 Storage client
  console.log('1️⃣  建立 GCS Storage client...')
  const storage = new Storage({
    projectId: PROJECT_ID,
    credentials: {
      client_email: CLIENT_EMAIL,
      private_key: PRIVATE_KEY,
    },
  })
  console.log('   ✅ Client 建立成功')

  // 2. 檢查 Bucket 存取
  console.log('\n2️⃣  檢查 Bucket 存取權限...')
  try {
    const [exists] = await storage.bucket(BUCKET_NAME).exists()
    if (!exists) {
      console.error(`   ❌ Bucket "${BUCKET_NAME}" 不存在`)
      process.exit(1)
    }
    console.log('   ✅ Bucket 存在且可存取')
  } catch (err: any) {
    console.error('   ❌ 無法存取 Bucket:', err.message)
    process.exit(1)
  }

  // 3. 準備測試檔案
  const inputFile = process.argv[2]
  let fileBuffer: Buffer
  let contentType: string
  let fileName: string

  if (inputFile) {
    const filePath = path.resolve(inputFile)
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 檔案不存在: ${filePath}`)
      process.exit(1)
    }
    fileBuffer = fs.readFileSync(filePath)
    const ext = path.extname(filePath).toLowerCase()
    contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
    fileName = path.basename(filePath)
    console.log(`\n3️⃣  使用提供的檔案: ${fileName} (${(fileBuffer.length / 1024).toFixed(1)} KB)`)
  } else {
    // 建立一個最小的 1x1 紅色 PNG
    fileBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    contentType = 'image/png'
    fileName = 'test-pixel.png'
    console.log('\n3️⃣  未提供檔案，使用自動產生的 1x1 測試圖片')
  }

  // 4. 產生 Signed URL
  console.log('\n4️⃣  產生 Signed Upload URL...')
  const gcsKey = `photos/test-${Date.now()}.${fileName.split('.').pop()}`

  try {
    const [uploadUrl] = await storage
      .bucket(BUCKET_NAME)
      .file(gcsKey)
      .getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000,
        contentType,
      })
    console.log('   ✅ Signed URL 產生成功')
    console.log(`   📎 GCS Key: ${gcsKey}`)

    // 5. 透過 Signed URL 上傳
    console.log('\n5️⃣  透過 Signed URL 上傳檔案...')
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: fileBuffer,
    })

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text()
      console.error(`   ❌ 上傳失敗 (${uploadRes.status}):`, errorText)
      process.exit(1)
    }
    console.log(`   ✅ 上傳成功 (HTTP ${uploadRes.status})`)

    // 6. 驗證檔案存在
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${gcsKey}`
    console.log('\n6️⃣  驗證檔案...')
    const [metadata] = await storage.bucket(BUCKET_NAME).file(gcsKey).getMetadata()
    console.log(`   ✅ 檔案確認存在`)
    console.log(`   📦 大小: ${metadata.size} bytes`)
    console.log(`   📄 類型: ${metadata.contentType}`)
    console.log(`   🔗 URL:  ${publicUrl}`)

    // 7. 清理測試檔案
    console.log('\n7️⃣  清理測試檔案...')
    await storage.bucket(BUCKET_NAME).file(gcsKey).delete()
    console.log('   ✅ 測試檔案已刪除')

    console.log('\n' + '═'.repeat(40))
    console.log('🎉 所有測試通過！GCS 設定正確。')
    console.log('═'.repeat(40))
  } catch (err: any) {
    console.error('   ❌ 錯誤:', err.message)
    process.exit(1)
  }
}

main()
