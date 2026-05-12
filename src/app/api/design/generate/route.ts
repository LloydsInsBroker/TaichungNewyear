import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { downloadGcsFile, uploadBufferToGcs } from '@/lib/gcs'
import { buildDesignPrompt, generateDesignImage, getImageModel } from '@/lib/openai'
import { getDailyQuota } from '@/lib/design-constants'
import type { DesignConditions } from '@/lib/design-constants'

// POST returns within ~1s now (background processing); GET is also quick.
export const maxDuration = 60
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

  const quota = getDailyQuota()
  const prompt = buildDesignPrompt(conditions)

  // Atomic quota check + create.
  // SELECT ... FOR UPDATE on the user row serializes concurrent submissions from the same user,
  // so parallel clicks can't all sneak past the quota check.
  let record: { id: string; status: string }
  let usedBeforeCreate: number
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user!.id} FOR UPDATE`

      const todayStart = startOfTodayInTaipei()
      const used = await tx.designGeneration.count({
        where: {
          userId: user!.id,
          createdAt: { gte: todayStart },
          status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
        },
      })
      if (used >= quota) {
        const e = new Error('quota_exceeded') as Error & {
          quotaExceeded: true
          used: number
          quota: number
        }
        e.quotaExceeded = true
        e.used = used
        e.quota = quota
        throw e
      }
      const created = await tx.designGeneration.create({
        data: {
          userId: user!.id,
          conditions: conditions as any,
          referenceKeys: refKeys,
          promptUsed: prompt,
          status: 'PROCESSING',
          model: getImageModel(),
        },
      })
      return { record: created, used }
    })
    record = result.record
    usedBeforeCreate = result.used
  } catch (err: any) {
    if (err?.quotaExceeded) {
      return NextResponse.json(
        {
          error: `今日生成額度已用完（${err.used}/${err.quota}），請明天再試。`,
          used: err.used,
          quota: err.quota,
        },
        { status: 429 },
      )
    }
    console.error('Failed to create design record:', err)
    return NextResponse.json(
      { error: '系統錯誤，請稍後再試' },
      { status: 500 },
    )
  }

  // Kick off background processing — do NOT await. The HTTP response returns
  // immediately; the Node process keeps the async function running until done.
  void processDesignGeneration({
    recordId: record.id,
    refKeys,
    prompt,
    userId: user!.id,
  })

  return NextResponse.json({
    id: record.id,
    status: record.status,
    remaining: Math.max(0, quota - usedBeforeCreate - 1),
    quota,
  })
}

/**
 * Background pipeline: download refs from GCS → call OpenAI → upload result → mark COMPLETED/FAILED.
 * Runs after the HTTP response has been sent. Errors are caught and persisted so the polling client can react.
 */
async function processDesignGeneration({
  recordId,
  refKeys,
  prompt,
  userId,
}: {
  recordId: string
  refKeys: string[]
  prompt: string
  userId: string
}): Promise<void> {
  console.log(
    `[design ${recordId}] (bg) user=${userId} refKeys=${refKeys.length} promptLen=${prompt.length}`,
  )

  try {
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
        `[design ${recordId}] downloaded ${referenceImages.length} reference image(s) from GCS — sizes: ${sizes}`,
      )
    } else {
      console.log(`[design ${recordId}] no reference images — using images.generate path`)
    }

    const startedAt = Date.now()
    const { imageB64 } = await generateDesignImage({
      prompt,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
    })
    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1)
    console.log(
      `[design ${recordId}] OpenAI returned ${imageB64.length} b64 chars in ${elapsedSec}s`,
    )

    const resultBuffer = Buffer.from(imageB64, 'base64')
    const resultKey = `designs/results/${userId}/${recordId}.png`
    await uploadBufferToGcs(resultKey, resultBuffer, 'image/png')

    await prisma.designGeneration.update({
      where: { id: recordId },
      data: {
        status: 'COMPLETED',
        resultGcsKey: resultKey,
      },
    })
    console.log(`[design ${recordId}] COMPLETED`)
  } catch (err: any) {
    console.error(`[design ${recordId}] FAILED:`, err)
    try {
      await prisma.designGeneration.update({
        where: { id: recordId },
        data: {
          status: 'FAILED',
          errorMessage: (err?.message || 'Unknown error').slice(0, 500),
        },
      })
    } catch (updateErr) {
      console.error(`[design ${recordId}] also failed to mark FAILED in DB:`, updateErr)
    }
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
