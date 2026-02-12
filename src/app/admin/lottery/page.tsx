'use client'

import { useEffect, useState } from 'react'

interface Prize {
  id: string
  name: string
  description: string | null
  quantity: number
  awarded: number
  imageUrl: string | null
  _count: { tickets: number }
}

interface Winner {
  id: string
  ticketNumber: string
  user: {
    id: string
    displayName: string
    pictureUrl: string | null
  }
}

export default function AdminLotteryPage() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drawCount, setDrawCount] = useState<Record<string, number>>({})
  const [drawing, setDrawing] = useState<string | null>(null)
  const [winners, setWinners] = useState<Record<string, Winner[]>>({})

  useEffect(() => {
    fetchPrizes()
  }, [])

  async function fetchPrizes() {
    try {
      const res = await fetch('/api/admin/prizes')
      if (!res.ok) throw new Error('Failed to fetch prizes')
      const data = await res.json()
      setPrizes(data.prizes)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDraw(prizeId: string) {
    const count = drawCount[prizeId] || 1
    setDrawing(prizeId)
    try {
      const res = await fetch('/api/admin/lottery/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizeId, count }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Draw failed')
      }
      const data = await res.json()
      setWinners((prev) => ({
        ...prev,
        [prizeId]: [...(prev[prizeId] || []), ...data.winners],
      }))
      await fetchPrizes()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDrawing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">載入中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">抽獎管理</h2>

      {prizes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          尚無獎品資料，請先在資料庫中新增獎品。
        </div>
      ) : (
        <div className="space-y-4">
          {prizes.map((prize) => {
            const remaining = prize.quantity - prize.awarded
            const prizeWinners = winners[prize.id] || []

            return (
              <div
                key={prize.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{prize.name}</h3>
                    {prize.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{prize.description}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-600">
                      已抽 {prize.awarded} / {prize.quantity}
                    </div>
                    <div className={`font-medium ${remaining > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      剩餘 {remaining}
                    </div>
                  </div>
                </div>

                {remaining > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-sm text-gray-600">抽出人數：</label>
                    <input
                      type="number"
                      min={1}
                      max={remaining}
                      value={drawCount[prize.id] || 1}
                      onChange={(e) =>
                        setDrawCount((prev) => ({
                          ...prev,
                          [prize.id]: Math.max(1, parseInt(e.target.value) || 1),
                        }))
                      }
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleDraw(prize.id)}
                      disabled={drawing === prize.id}
                      className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {drawing === prize.id ? '抽獎中...' : '抽獎'}
                    </button>
                  </div>
                )}

                {prizeWinners.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      本次中獎者 ({prizeWinners.length})
                    </h4>
                    <div className="space-y-1">
                      {prizeWinners.map((w) => (
                        <div
                          key={w.id}
                          className="flex items-center gap-2 text-sm bg-green-50 rounded px-2 py-1"
                        >
                          <span className="font-mono text-xs text-gray-500">
                            {w.ticketNumber}
                          </span>
                          <span className="text-gray-900">{w.user.displayName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
