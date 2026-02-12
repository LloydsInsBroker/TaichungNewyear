'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface UserProfile {
  id: string
  displayName: string
  pictureUrl: string | null
  totalPoints: number
  role: string
}

interface Stats {
  taskCompletionCount: number
  photoUploadCount: number
  lotteryTicketCount: number
}

interface Transaction {
  id: string
  amount: number
  type: string
  description: string | null
  createdAt: string
}

interface Ticket {
  id: string
  ticketNumber: string
  status: string
  createdAt: string
}

interface ProfileData {
  user: UserProfile
  stats: Stats
  recentTransactions: Transaction[]
  lotteryTickets: Ticket[]
}

const TYPE_LABELS: Record<string, string> = {
  TASK_COMPLETION: '任務完成',
  PHOTO_UPLOAD: '照片上傳',
  EARLY_LOGIN: '搶先登入獎勵',
  ADMIN_ADJUSTMENT: '管理員調整',
}

const TYPE_ICONS: Record<string, string> = {
  TASK_COMPLETION: '\u2705',
  PHOTO_UPLOAD: '\uD83D\uDCF7',
  EARLY_LOGIN: '\uD83C\uDF89',
  ADMIN_ADJUSTMENT: '\u2699\uFE0F',
}

const TICKET_STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-imperial-gold-100 text-imperial-gold-700',
  WINNER: 'bg-lucky-red-100 text-lucky-red-700',
  NOT_WINNER: 'bg-gray-100 text-gray-500',
}

const TICKET_STATUS_LABELS: Record<string, string> = {
  ACTIVE: '待開獎',
  WINNER: '中獎',
  NOT_WINNER: '未中獎',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
}

export default function MyPage() {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/users/me')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load profile')
        return res.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-lucky-red font-bold">{error}</p>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="cny-card p-6 flex flex-col items-center">
          <SkeletonBlock className="w-20 h-20 rounded-full" />
          <SkeletonBlock className="w-32 h-5 mt-3" />
          <SkeletonBlock className="w-20 h-8 mt-2" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-20" />
          ))}
        </div>
        <SkeletonBlock className="h-40" />
      </div>
    )
  }

  const { user, stats, recentTransactions, lotteryTickets } = data

  return (
    <div className="space-y-4">
      {/* Profile header */}
      <div className="cny-card p-6 flex flex-col items-center">
        {user.pictureUrl ? (
          <Image
            src={user.pictureUrl}
            alt={user.displayName}
            width={80}
            height={80}
            className="rounded-full object-cover w-20 h-20"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-lucky-red-200 text-lucky-red-800 flex items-center justify-center text-3xl font-bold">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          <h2 className="text-xl font-bold">{user.displayName}</h2>
          {user.role === 'ADMIN' && (
            <span className="text-xs bg-lucky-red text-white px-2 py-0.5 rounded-full font-medium">
              管理員
            </span>
          )}
        </div>
        <p className="mt-1 text-3xl font-bold text-imperial-gold">
          {user.totalPoints}
          <span className="text-base ml-1 text-imperial-gold-600">分</span>
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="cny-card p-3 text-center">
          <p className="text-2xl font-bold text-lucky-red">{stats.taskCompletionCount}</p>
          <p className="text-xs text-gray-500 mt-1">任務完成</p>
        </div>
        <div className="cny-card p-3 text-center">
          <p className="text-2xl font-bold text-lucky-red">{stats.photoUploadCount}</p>
          <p className="text-xs text-gray-500 mt-1">照片上傳</p>
        </div>
        <div className="cny-card p-3 text-center">
          <p className="text-2xl font-bold text-lucky-red">{stats.lotteryTicketCount}</p>
          <p className="text-xs text-gray-500 mt-1">抽獎券</p>
        </div>
      </div>

      {/* Lottery tickets */}
      {lotteryTickets.length > 0 && (
        <div className="cny-card p-4">
          <h3 className="font-bold text-lucky-red mb-3">我的抽獎券</h3>
          <div className="space-y-2">
            {lotteryTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
              >
                <span className="font-mono font-bold text-sm">{ticket.ticketNumber}</span>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    TICKET_STATUS_STYLES[ticket.status] || 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {TICKET_STATUS_LABELS[ticket.status] || ticket.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="cny-card p-4">
        <h3 className="font-bold text-lucky-red mb-3">最近積分紀錄</h3>
        {recentTransactions.length === 0 ? (
          <p className="text-center py-4 text-gray-400 text-sm">尚無紀錄</p>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0"
              >
                <span className="text-lg">{TYPE_ICONS[tx.type] || '\uD83D\uDCB0'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {tx.description || TYPE_LABELS[tx.type] || tx.type}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                </div>
                <span
                  className={`text-sm font-bold ${
                    tx.amount > 0 ? 'text-imperial-gold-600' : 'text-gray-400'
                  }`}
                >
                  {tx.amount > 0 ? '+' : ''}
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
