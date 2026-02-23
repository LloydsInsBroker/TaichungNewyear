'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface TicketUser {
  rank: number
  displayName: string
  pictureUrl: string | null
  totalPoints: number
  ticketCount: number
  isCurrentUser: boolean
}

function Avatar({ src, name, size = 32 }: { src: string | null; name: string; size?: number }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }

  const initial = name.charAt(0).toUpperCase()
  return (
    <div
      className="rounded-full bg-lucky-red-200 text-lucky-red-800 flex items-center justify-center font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  )
}

export default function LotteryTicketsPage() {
  const [users, setUsers] = useState<TicketUser[]>([])
  const [myTicketCount, setMyTicketCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/lottery/tickets')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load')
        return res.json()
      })
      .then((data) => {
        setUsers(data.users)
        setMyTicketCount(data.myTicketCount)
      })
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

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-lucky-red">抽獎券</h2>
        <p className="text-sm text-gray-500 mt-1">每 6 積分可獲得 1 張抽獎券</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-8 h-5 bg-gray-200 rounded" />
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1 h-4 bg-gray-200 rounded" />
              <div className="w-16 h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* My ticket summary */}
          <div className="cny-card p-4 mb-4 bg-lucky-red-50 border-lucky-red-200 text-center">
            <p className="text-sm text-gray-600">你的抽獎券</p>
            <p className="text-3xl font-bold text-lucky-red mt-1">{myTicketCount} 張</p>
          </div>

          {/* Everyone's tickets */}
          <div className="cny-card overflow-hidden">
            {users.map((u) => (
              <div
                key={u.rank}
                className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                  u.isCurrentUser ? 'bg-lucky-red-50' : ''
                }`}
              >
                <span className={`w-8 text-center font-bold text-sm ${
                  u.rank <= 3 ? 'text-imperial-gold-600' : 'text-gray-400'
                }`}>
                  {u.rank}
                </span>
                <Avatar src={u.pictureUrl} name={u.displayName} size={32} />
                <span className="flex-1 text-sm font-medium truncate">
                  {u.displayName}
                  {u.isCurrentUser && (
                    <span className="ml-1 text-xs text-lucky-red">(你)</span>
                  )}
                </span>
                <div className="text-right">
                  <span className="text-sm font-bold text-lucky-red">
                    {u.ticketCount} 張
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    / {u.totalPoints} 分
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
