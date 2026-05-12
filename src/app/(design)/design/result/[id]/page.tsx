'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  HOME_TYPES,
  SIZE_RANGES,
  LAYOUTS,
  SPACES,
  RESIDENTS,
  LIFESTYLES,
  STORAGE_NEEDS,
  SPECIAL_NEEDS,
  STYLES,
  COLOR_SCHEMES,
  MATERIALS,
  findOption,
  findOptions,
  type DesignConditions,
} from '@/lib/design-constants'

interface DesignRecord {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  conditions: DesignConditions
  imageUrl: string | null
  errorMessage: string | null
  createdAt: string
}

export default function ResultPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [record, setRecord] = useState<DesignRecord | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = async () => {
      try {
        const res = await fetch(`/api/design/${params.id}`)
        if (!res.ok) {
          throw new Error((await res.json().catch(() => ({}))).error || '無法載入結果')
        }
        const data: DesignRecord = await res.json()
        if (!active) return
        setRecord(data)
        if (data.status === 'PENDING' || data.status === 'PROCESSING') {
          timer = setTimeout(tick, 3000)
        }
      } catch (err: any) {
        if (active) setError(err?.message || '載入失敗')
      }
    }

    tick()
    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [params.id])

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error}</p>
        <Link
          href="/design"
          className="inline-block mt-6 px-5 py-2 rounded-lg bg-stone-900 text-white text-sm"
        >
          回到設計工具
        </Link>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-stone-500 mt-4">載入中…</p>
      </div>
    )
  }

  if (record.status === 'PROCESSING' || record.status === 'PENDING') {
    const elapsedMs = Date.now() - new Date(record.createdAt).getTime()
    const elapsedMin = Math.floor(elapsedMs / 60000)
    const elapsedSec = Math.floor((elapsedMs % 60000) / 1000)
    const stuck = elapsedMs > 10 * 60 * 1000 // 10 minutes

    if (stuck) {
      return (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">⏱️</div>
          <h3 className="text-lg font-semibold text-stone-900">生成時間過長</h3>
          <p className="text-sm text-stone-600 mt-2 max-w-md mx-auto">
            這張圖已經處理超過 10 分鐘還沒完成，後端可能卡住了。
            這次失敗不會扣除今日額度。
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/design"
              className="px-5 py-2 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-700"
            >
              重新生成
            </Link>
            <Link
              href="/design/history"
              className="px-5 py-2 rounded-lg border border-stone-300 text-sm hover:bg-stone-100"
            >
              我的記錄
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-base text-stone-700 mt-6">AI 正在生成你的設計提案…</p>
        <p className="text-xs text-stone-400 mt-1">
          已等待 {elapsedMin > 0 ? `${elapsedMin} 分 ` : ''}{elapsedSec} 秒（通常 2-3 分鐘）
        </p>
        <p className="text-xs text-stone-400 mt-3 max-w-xs text-center">
          你可以離開這個頁面去做其他事，之後回到「我的記錄」就能看到結果
        </p>
        <Link
          href="/design/history"
          className="mt-6 text-sm text-stone-600 underline-offset-2 hover:underline"
        >
          先去看歷史記錄
        </Link>
      </div>
    )
  }

  if (record.status === 'FAILED') {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-semibold text-stone-900">生成失敗</h3>
        <p className="text-sm text-stone-600 mt-2 max-w-md mx-auto">
          {record.errorMessage || '請稍後再試，這次失敗不會扣除今日額度。'}
        </p>
        <Link
          href="/design"
          className="inline-block mt-6 px-5 py-2 rounded-lg bg-stone-900 text-white text-sm"
        >
          回到設計工具
        </Link>
      </div>
    )
  }

  // COMPLETED
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">你的設計提案</h2>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/design/history"
            className="text-sm px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-100"
          >
            我的記錄
          </Link>
          <button
            onClick={() => router.push('/design')}
            className="text-sm px-4 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-700"
          >
            再生一張
          </button>
        </div>
      </div>

      {record.imageUrl && (
        <div className="rounded-xl overflow-hidden border border-stone-200 bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={record.imageUrl}
            alt="AI 居家設計提案"
            className="w-full h-auto"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {record.imageUrl && (
          <a
            href={record.imageUrl}
            download={`design-${record.id}.png`}
            className="px-5 py-2 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-700"
          >
            下載圖片
          </a>
        )}
      </div>

      <ConditionsSummary conditions={record.conditions} />
    </div>
  )
}

function ConditionsSummary({ conditions }: { conditions: DesignConditions }) {
  const rows: Array<[string, string]> = [
    ['房屋類型', findOption(HOME_TYPES, conditions.homeType)?.label || '—'],
    ['坪數', findOption(SIZE_RANGES, conditions.size)?.label || '—'],
    ['格局', findOption(LAYOUTS, conditions.layout)?.label || '—'],
    [
      '空間',
      findOptions(SPACES, conditions.spaces).map((o) => o.label).join('、') || '—',
    ],
    [
      '居住成員',
      findOptions(RESIDENTS, conditions.residents).map((o) => o.label).join('、') || '—',
    ],
    [
      '生活習慣',
      findOptions(LIFESTYLES, conditions.lifestyles).map((o) => o.label).join('、') || '—',
    ],
    [
      '收納需求',
      findOptions(STORAGE_NEEDS, conditions.storageNeeds).map((o) => o.label).join('、') || '—',
    ],
    [
      '特殊需求',
      findOptions(SPECIAL_NEEDS, conditions.specialNeeds).map((o) => o.label).join('、') || '—',
    ],
    ['風格', findOption(STYLES, conditions.style)?.label || '—'],
    ['色系', findOption(COLOR_SCHEMES, conditions.colorScheme)?.label || '—'],
    [
      '材質',
      findOptions(MATERIALS, conditions.materials).map((o) => o.label).join('、') || '—',
    ],
  ]

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-stone-800 mb-2">設計條件</h3>
      <div className="rounded-lg border border-stone-200 bg-white divide-y divide-stone-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex px-4 py-3 text-sm">
            <span className="w-24 shrink-0 text-stone-500">{label}</span>
            <span className="text-stone-900">{value}</span>
          </div>
        ))}
        {conditions.freeformNotes && (
          <div className="px-4 py-3 text-sm">
            <span className="block text-stone-500 mb-1">補充說明</span>
            <p className="text-stone-900 whitespace-pre-wrap">{conditions.freeformNotes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
