'use client'

import { useEffect, useState } from 'react'
import BonusDrawAnimation from '@/components/BonusDrawAnimation'

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

interface DrawPreview {
  prizeId: string
  prizeName: string
  eligibleUsers: { displayName: string; pictureUrl: string | null }[]
  selectedTicket: {
    id: string
    ticketNumber: string
    user: { id: string; displayName: string; pictureUrl: string | null }
  }
}

export default function AdminLotteryPage() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drawing, setDrawing] = useState<string | null>(null)
  const [winners, setWinners] = useState<Record<string, Winner[]>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPrize, setNewPrize] = useState({ name: '', description: '', quantity: 1 })
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [settling, setSettling] = useState(false)
  const [settleResult, setSettleResult] = useState<{
    totalGenerated: number
    usersSettled: number
    details: { displayName: string; generated: number }[]
  } | null>(null)
  const [drawPreview, setDrawPreview] = useState<DrawPreview | null>(null)
  const [animKey, setAnimKey] = useState(0)

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

  async function handleAddPrize() {
    if (!newPrize.name.trim()) {
      alert('請輸入獎品名稱')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/admin/prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPrize.name.trim(),
          description: newPrize.description.trim() || undefined,
          quantity: newPrize.quantity,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '新增失敗')
      }
      setNewPrize({ name: '', description: '', quantity: 1 })
      setShowAddForm(false)
      await fetchPrizes()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleDeletePrize(prizeId: string, prizeName: string) {
    if (!confirm(`確定要刪除「${prizeName}」嗎？`)) return
    setDeleting(prizeId)
    try {
      const res = await fetch(`/api/admin/prizes?id=${prizeId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '刪除失敗')
      }
      await fetchPrizes()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  async function handleReset() {
    if (!confirm('確定要重置所有抽獎結果嗎？所有中獎券將恢復為 ACTIVE 狀態，獎品已抽數量歸零。')) return
    setResetting(true)
    try {
      const res = await fetch('/api/admin/lottery/draw', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '重置失敗')
      }
      const data = await res.json()
      alert(`重置完成，共恢復 ${data.resetTickets} 張抽獎券`)
      setWinners({})
      await fetchPrizes()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setResetting(false)
    }
  }

  async function handleSettle() {
    if (!confirm('確定要結算所有用戶的抽獎券嗎？將根據積分補發缺少的抽獎券。')) return
    setSettling(true)
    setSettleResult(null)
    try {
      const res = await fetch('/api/admin/lottery/settle', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '結算失敗')
      }
      const data = await res.json()
      setSettleResult(data)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSettling(false)
    }
  }

  async function handleDraw(prizeId: string) {
    const prize = prizes.find((p) => p.id === prizeId)
    if (!prize) return
    setDrawing(prizeId)
    try {
      const res = await fetch(`/api/admin/lottery/draw?prizeId=${prizeId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '抽獎失敗')
      }
      const data = await res.json()
      setDrawPreview({
        prizeId,
        prizeName: prize.name,
        eligibleUsers: data.eligibleUsers,
        selectedTicket: data.selectedTicket,
      })
      setAnimKey((k) => k + 1)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDrawing(null)
    }
  }

  async function handleConfirmDraw() {
    if (!drawPreview) return
    try {
      const res = await fetch('/api/admin/lottery/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prizeId: drawPreview.prizeId,
          ticketId: drawPreview.selectedTicket.id,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '確認失敗')
      }
      const data = await res.json()
      setWinners((prev) => ({
        ...prev,
        [drawPreview.prizeId]: [
          ...(prev[drawPreview.prizeId] || []),
          data.winner,
        ],
      }))
      setDrawPreview(null)
      await fetchPrizes()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleRedraw() {
    if (!drawPreview) return
    try {
      const res = await fetch(`/api/admin/lottery/draw?prizeId=${drawPreview.prizeId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '重新抽獎失敗')
      }
      const data = await res.json()
      setDrawPreview((prev) => prev && ({
        ...prev,
        eligibleUsers: data.eligibleUsers,
        selectedTicket: data.selectedTicket,
      }))
      setAnimKey((k) => k + 1)
    } catch (err: any) {
      alert(err.message)
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">抽獎管理</h2>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
          >
            {resetting ? '重置中...' : '重置抽獎'}
          </button>
          <button
            onClick={handleSettle}
            disabled={settling}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            {settling ? '結算中...' : '結算抽獎券'}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            {showAddForm ? '取消' : '+ 新增獎品'}
          </button>
        </div>
      </div>

      {settleResult && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-amber-800 mb-2">
            結算完成 - 共結算 {settleResult.usersSettled} 位用戶
          </h3>
          {settleResult.totalGenerated === 0 ? (
            <p className="text-sm text-amber-700">所有用戶的抽獎券皆已正確，無需補發。</p>
          ) : (
            <>
              <p className="text-sm text-amber-700 mb-2">
                共補發 {settleResult.totalGenerated} 張抽獎券：
              </p>
              <div className="space-y-1">
                {settleResult.details.map((d, i) => (
                  <div key={i} className="text-sm text-amber-800">
                    {d.displayName}：+{d.generated} 張
                  </div>
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => setSettleResult(null)}
            className="mt-2 text-xs text-amber-600 hover:text-amber-800"
          >
            關閉
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white rounded-lg border border-green-200 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">新增獎品</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">獎品名稱 *</label>
              <input
                type="text"
                value={newPrize.name}
                onChange={(e) => setNewPrize((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="例：iPhone 16 Pro"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">說明（選填）</label>
              <input
                type="text"
                value={newPrize.description}
                onChange={(e) => setNewPrize((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="例：256GB 太空黑色"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">數量 *</label>
              <input
                type="number"
                min={1}
                value={newPrize.quantity}
                onChange={(e) =>
                  setNewPrize((prev) => ({
                    ...prev,
                    quantity: Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
                className="w-24 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <button
              onClick={handleAddPrize}
              disabled={adding}
              className="bg-green-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {adding ? '新增中...' : '確認新增'}
            </button>
          </div>
        </div>
      )}

      {prizes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          尚無獎品資料，請點擊上方「+ 新增獎品」來新增。
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
                  <div className="flex items-start gap-3">
                    <div className="text-right text-sm">
                      <div className="text-gray-600">
                        已抽 {prize.awarded} / {prize.quantity}
                      </div>
                      <div className={`font-medium ${remaining > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        剩餘 {remaining}
                      </div>
                    </div>
                    {prize.awarded === 0 && (
                      <button
                        onClick={() => handleDeletePrize(prize.id, prize.name)}
                        disabled={deleting === prize.id}
                        className="text-red-400 hover:text-red-600 text-sm px-1 disabled:opacity-50"
                        title="刪除獎品"
                      >
                        {deleting === prize.id ? '...' : '✕'}
                      </button>
                    )}
                  </div>
                </div>

                {remaining > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => handleDraw(prize.id)}
                      disabled={drawing === prize.id}
                      className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {drawing === prize.id ? '準備中...' : '抽獎'}
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

      {drawPreview && (
        <BonusDrawAnimation
          key={animKey}
          users={drawPreview.eligibleUsers}
          winner={{
            displayName: drawPreview.selectedTicket.user.displayName,
            pictureUrl: drawPreview.selectedTicket.user.pictureUrl,
          }}
          prizeName={drawPreview.prizeName}
          onConfirm={handleConfirmDraw}
          onRedraw={handleRedraw}
          onClose={() => setDrawPreview(null)}
        />
      )}
    </div>
  )
}
