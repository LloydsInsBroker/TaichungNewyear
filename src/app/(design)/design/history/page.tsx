'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  STYLES,
  COLOR_SCHEMES,
  findOption,
} from '@/lib/design-constants'

interface HistoryItem {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  createdAt: string
  errorMessage: string | null
  style: string | null
  colorScheme: string | null
  thumbnailUrl: string | null
}

const STATUS_LABEL: Record<HistoryItem['status'], { text: string; color: string }> = {
  PENDING:    { text: '等待中', color: 'bg-stone-100 text-stone-600' },
  PROCESSING: { text: '生成中', color: 'bg-amber-100 text-amber-700' },
  COMPLETED:  { text: '已完成', color: 'bg-emerald-100 text-emerald-700' },
  FAILED:     { text: '失敗',   color: 'bg-red-100 text-red-700' },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${m}/${day} ${hh}:${mm}`
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = async () => {
      try {
        const res = await fetch('/api/design/list?limit=30')
        if (!res.ok) throw new Error('無法載入歷史記錄')
        const data = await res.json()
        if (!active) return
        setItems(data.items)
        // If any are still PROCESSING, keep polling so the list auto-refreshes
        if (data.items.some((i: HistoryItem) => i.status === 'PROCESSING' || i.status === 'PENDING')) {
          timer = setTimeout(tick, 5000)
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
  }, [])

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!items) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-stone-500 mt-4">載入中…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">我的設計記錄</h2>
        <Link
          href="/design"
          className="text-sm px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-100"
        >
          + 新增設計
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-stone-300 bg-white">
          <p className="text-stone-500 text-sm">你還沒有任何設計記錄</p>
          <Link
            href="/design"
            className="inline-block mt-4 px-5 py-2 rounded-lg bg-stone-900 text-white text-sm"
          >
            開始第一張設計
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <HistoryCard key={it.id} item={it} />
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryCard({ item }: { item: HistoryItem }) {
  const styleLabel = item.style ? findOption(STYLES, item.style)?.label : null
  const colorLabel = item.colorScheme ? findOption(COLOR_SCHEMES, item.colorScheme)?.label : null
  const status = STATUS_LABEL[item.status]

  return (
    <Link
      href={`/design/result/${item.id}`}
      className="block rounded-xl overflow-hidden border border-stone-200 bg-white hover:shadow-md hover:border-stone-400 transition-all"
    >
      <div className="aspect-[3/2] bg-stone-100 relative">
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt="設計提案縮圖"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {item.status === 'PROCESSING' || item.status === 'PENDING' ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-stone-500">生成中…</span>
              </div>
            ) : (
              <span className="text-3xl">{item.status === 'FAILED' ? '⚠️' : '🏠'}</span>
            )}
          </div>
        )}
        <span
          className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}
        >
          {status.text}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <div className="text-sm font-medium text-stone-900">
          {styleLabel || '—'} {colorLabel && <span className="text-stone-400">· {colorLabel}</span>}
        </div>
        <div className="text-xs text-stone-500 mt-0.5">{formatDate(item.createdAt)}</div>
      </div>
    </Link>
  )
}
