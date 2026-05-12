import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { downloadGcsFile, uploadBufferToGcs } from '@/lib/gcs'
import { buildDesignPrompt, generateDesignImage, getImageModel } from '@/lib/openai'
import { getDailyQuota } from '@/lib/design-constants'
import type { DesignConditions } from '@/lib/design-constants'

// gpt-image-2 HD takes ~2-3 min in practice; raise route timeout well above that.
// Note: actual ceiling depends on host (Vercel Pro caps at 300s; Cloud Run default 300s, configurable up to 3600s).
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const TZ_OFFSET_HOURS = 8 // UTC+8 (Taiwan)

/** Returns the start of "today" in UTC+8, expressed as a UTC Date. */
function startOfTodayInTaipei(): Date {
  const now = new Date()
  const taipeiMs = now.getTime() + TZ_OFFSET_HOURS * 60 * 60 * 1000
  const taipeiDate = new Date(taipeiMs)
  taipeiDate.setUTCHours(0, 0, 0, 0)
  return new Date(taipeiDate.getTime() - TZ_OFFSET_HOURS * 60 * 60 * 1000)
}

function validateConditions(c: any): c is DesignConditions {
  return (
    c &&
    typeof c.homeType === 'string' && c.homeType.length > 0 &&
    typeof c.size === 'string' && c.size.length > 0 &&
    typeof c.layout === 'string' && c.layout.length > 0 &&
    Array.isArray(c.spaces) && c.spaces.length > 0 &&
    Array.isArray(c.residents) &&
    Array.isArray(c.lifestyles) &&
    Array.isArray(c.storageNeeds) &&
    Array.isArray(c.specialNeeds) &&
    typeof c.style === 'string' && c.style.length > 0 &&
    typeof c.colorScheme === 'string' && c.colorScheme.length > 0 &&
    Array.isArray(c.materials)
  )
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireAuth()
  if (error) return error

  let payload: any
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { conditions, referenceGcsKeys } = payload || {}

  if (!validateConditions(conditions)) {
    return NextResponse.json(
      { error: 'Missing or invalid conditions' },
      { status: 400 },
    )
  }

  const refKeys: string[] = Array.isArray(referenceGcsKeys) ? referenceGcsKeys : []

  // Validate that all reference keys belong to this user (path prefix check).
  const userRefPrefix = `designs/refs/${user!.id}/`
  for (const key of refKeys) {
    if (typeof key !== 'string' || !key.startsWith(userRefPrefix)) {
      return NextResponse.json(
        { error: 'Reference image keys must belong to the current user' },
        { status: 400 },
      )
    }
  }
  if (refKeys.length > 8) {
    return NextResponse.json(
      { error: '最多只能上傳 8 張參考圖' },
      { status: 400 },
    )
  }

  // Daily quota check.
  const quota = getDailyQuota()
  const todayStart = startOfTodayInTaipei()
  const usedToday = await prisma.designGeneration.count({
    where: {
      userId: user!.id,
      createdAt: { gte: todayStart },
      status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
    },
  })
  if (usedToday >= quota) {
    return NextResponse.json(
      {
        error: `今日生成額度已用完（${usedToday}/${quota}），請明天再試。`,
        used: usedToday,
        quota,
      },
      { status: 429 },
    )
  }

  // Build the prompt up front so we can save it even if generation fails.
  const prompt = buildDesignPrompt(conditions)

  // Create the DB record in PROCESSING state.
  const record = await prisma.designGeneration.create({
    data: {
      userId: user!.id,
      conditions: conditions as any,
      referenceKeys: refKeys,
      promptUsed: prompt,
      status: 'PROCESSING',
      model: getImageModel(),
    },
  })

  console.log(
    `[design ${record.id}] user=${user!.id} refKeys=${refKeys.length} promptLen=${prompt.length}`,
  )

  try {
    // Download reference images from GCS.
    const referenceImages = await Promise.all(
      refKeys.map(async (key, i) => {
        const { buffer, contentType } = await downloadGcsFile(key)
        const ext = (contentType.split('/')[1] || 'png').replace('jpeg', 'jpg')
        return {
          buffer,
          mimeType: contentType,
          filename: `ref-${i}.${ext}`,
        }
      }),
    )

    if (referenceImages.length > 0) {
      const sizes = referenceImages.map((r) => `${(r.buffer.length / 1024).toFixed(1)}KB`).join(', ')
      console.log(
        `[design ${record.id}] downloaded ${referenceImages.length} reference image(s) from GCS — sizes: ${sizes}`,
      )
    } else {
      console.log(`[design ${record.id}] no reference images — using images.generate path`)
    }

    const startedAt = Date.now()
    // Call OpenAI.
    const { imageB64 } = await generateDesignImage({
      prompt,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
    })
    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1)
    console.log(
      `[design ${record.id}] OpenAI returned ${imageB64.length} b64 chars in ${elapsedSec}s`,
    )

    // Decode and upload result.
    const resultBuffer = Buffer.from(imageB64, 'base64')
    const resultKey = `designs/results/${user!.id}/${record.id}.png`
    await uploadBufferToGcs(resultKey, resultBuffer, 'image/png')

    // Mark as completed.
    const updated = await prisma.designGeneration.update({
      where: { id: record.id },
      data: {
        status: 'COMPLETED',
        resultGcsKey: resultKey,
      },
    })

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      remaining: Math.max(0, quota - usedToday - 1),
      quota,
    })
  } catch (err: any) {
    console.error(`Design generation failed (id=${record.id}):`, err)
    await prisma.designGeneration.update({
      where: { id: record.id },
      data: {
        status: 'FAILED',
        errorMessage: (err?.message || 'Unknown error').slice(0, 500),
      },
    })
    return NextResponse.json(
      {
        id: record.id,
        status: 'FAILED',
        error: err?.message || '生成失敗，請稍後再試',
      },
      { status: 500 },
    )
  }
}

/** Returns today's usage stats for the current user (used by the form to show remaining quota). */
export async function GET() {
  const { error, user } = await requireAuth()
  if (error) return error

  const quota = getDailyQuota()
  const todayStart = startOfTodayInTaipei()
  const usedToday = await prisma.designGeneration.count({
    where: {
      userId: user!.id,
      createdAt: { gte: todayStart },
      status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
    },
  })

  return NextResponse.json({
    used: usedToday,
    quota,
    remaining: Math.max(0, quota - usedToday),
  })
}
