'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface UserItem {
  id: string
  displayName: string
  pictureUrl: string | null
  role: 'USER' | 'ADMIN'
  totalPoints: number
  createdAt: string
  _count: {
    taskCompletions: number
    photoUploads: number
    lotteryTickets: number
  }
}

interface Transaction {
  id: string
  amount: number
  type: string
  description: string | null
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  TASK_COMPLETION: '任務完成',
  PHOTO_UPLOAD: '照片上傳',
  EARLY_LOGIN: '搶先登入獎勵',
  ADMIN_ADJUSTMENT: '管理員調整',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustDesc, setAdjustDesc] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Transaction viewer
  const [txUserId, setTxUserId] = useState<string | null>(null)
  const [txUserName, setTxUserName] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers(searchTerm?: string) {
    setLoading(true)
    try {
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''
      const res = await fetch(`/api/admin/users${params}`)
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.users)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchUsers(search)
  }

  async function toggleRole(userId: string, currentRole: string) {
    setActionLoading(true)
    try {
      const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update role')
      }
      await fetchUsers(search)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function submitAdjustPoints(userId: string) {
    const amount = parseInt(adjustAmount)
    if (isNaN(amount) || amount === 0) {
      alert('請輸入有效的數字（不為零）')
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, adjustPoints: amount, description: adjustDesc.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to adjust points')
      }
      setAdjustingId(null)
      setAdjustAmount('')
      setAdjustDesc('')
      await fetchUsers(search)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function openTransactions(userId: string, displayName: string) {
    setTxUserId(userId)
    setTxUserName(displayName)
    setTxLoading(true)
    setTransactions([])
    try {
      const res = await fetch(`/api/admin/points?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch transactions')
      const data = await res.json()
      setTransactions(data.transactions)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setTxLoading(false)
    }
  }

  async function deleteTransaction(txId: string) {
    if (!confirm('確定要刪除這筆積分紀錄嗎？該用戶的總積分會同步扣除。')) return
    setDeleting(txId)
    try {
      const res = await fetch(`/api/admin/points/${txId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '刪除失敗')
      }
      // Refresh transactions and users
      setTransactions((prev) => prev.filter((t) => t.id !== txId))
      await fetchUsers(search)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  if (error && !loading) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">用戶管理</h2>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋用戶名稱..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800"
        >
          搜尋
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">載入中...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">用戶</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">積分</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">完成/照片/券</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">角色</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.pictureUrl ? (
                        <Image
                          src={user.pictureUrl}
                          alt={user.displayName}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                          ?
                        </div>
                      )}
                      <span className="text-gray-900 font-medium">{user.displayName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{user.totalPoints}</td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                    {user._count.taskCompletions} / {user._count.photoUploads} / {user._count.lotteryTickets}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => toggleRole(user.id, user.role)}
                        disabled={actionLoading}
                        className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 disabled:opacity-50"
                      >
                        {user.role === 'ADMIN' ? '移除管理員' : '設為管理員'}
                      </button>
                      {adjustingId === user.id ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <input
                              type="number"
                              value={adjustAmount}
                              onChange={(e) => setAdjustAmount(e.target.value)}
                              placeholder="+/-"
                              className="w-16 border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => submitAdjustPoints(user.id)}
                              disabled={actionLoading}
                              className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              確認
                            </button>
                            <button
                              onClick={() => {
                                setAdjustingId(null)
                                setAdjustAmount('')
                                setAdjustDesc('')
                              }}
                              className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-200"
                            >
                              取消
                            </button>
                          </div>
                          <input
                            type="text"
                            value={adjustDesc}
                            onChange={(e) => setAdjustDesc(e.target.value)}
                            placeholder="說明 (選填)"
                            maxLength={100}
                            className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setAdjustingId(user.id)}
                          className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                        >
                          調整積分
                        </button>
                      )}
                      <button
                        onClick={() => openTransactions(user.id, user.displayName)}
                        className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded hover:bg-amber-100"
                      >
                        積分紀錄
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">無用戶資料</div>
          )}
        </div>
      )}

      {/* Transaction Modal */}
      {txUserId && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setTxUserId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">
                {txUserName} 的積分紀錄
              </h3>
              <button
                onClick={() => setTxUserId(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {txLoading ? (
                <div className="text-center py-8 text-gray-400">載入中...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">尚無積分紀錄</div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                            {TYPE_LABELS[tx.type] || tx.type}
                          </span>
                          <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {tx.description && (
                            <span className="text-xs text-gray-500 truncate">{tx.description}</span>
                          )}
                          <span className="text-xs text-gray-400">{formatDate(tx.createdAt)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        disabled={deleting === tx.id}
                        className="flex-shrink-0 text-xs bg-red-50 text-red-600 px-2.5 py-1.5 rounded hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        {deleting === tx.id ? '刪除中...' : '刪除'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-200 text-right">
              <button
                onClick={() => setTxUserId(null)}
                className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
