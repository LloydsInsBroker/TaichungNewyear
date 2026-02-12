'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface LeaderboardEntry {
  rank: number
  displayName: string
  pictureUrl: string | null
  totalPoints: number
  isCurrentUser: boolean
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  myRank: number
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

function PodiumCard({ entry, medal }: { entry: LeaderboardEntry; medal: 'gold' | 'silver' | 'bronze' }) {
  const colors = {
    gold: {
      bg: 'bg-gradient-to-b from-imperial-gold-100 to-imperial-gold-50',
      border: 'border-imperial-gold',
      text: 'text-imperial-gold-700',
      badge: 'bg-imperial-gold text-white',
      icon: '\uD83E\uDD47',
    },
    silver: {
      bg: 'bg-gradient-to-b from-gray-100 to-gray-50',
      border: 'border-gray-300',
      text: 'text-gray-600',
      badge: 'bg-gray-400 text-white',
      icon: '\uD83E\uDD48',
    },
    bronze: {
      bg: 'bg-gradient-to-b from-orange-100 to-orange-50',
      border: 'border-orange-300',
      text: 'text-orange-700',
      badge: 'bg-orange-400 text-white',
      icon: '\uD83E\uDD49',
    },
  }

  const c = colors[medal]
  const avatarSize = medal === 'gold' ? 64 : 48

  return (
    <div
      className={`flex flex-col items-center p-3 rounded-xl border-2 ${c.bg} ${c.border} ${
        entry.isCurrentUser ? 'ring-2 ring-lucky-red ring-offset-2' : ''
      }`}
    >
      <span className="text-2xl mb-1">{c.icon}</span>
      <Avatar src={entry.pictureUrl} name={entry.displayName} size={avatarSize} />
      <p className="mt-2 text-sm font-bold text-center truncate w-full">{entry.displayName}</p>
      <p className={`text-lg font-bold ${c.text}`}>{entry.totalPoints}</p>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <div className="w-8 h-5 bg-gray-200 rounded" />
      <div className="w-8 h-8 bg-gray-200 rounded-full" />
      <div className="flex-1 h-4 bg-gray-200 rounded" />
      <div className="w-12 h-4 bg-gray-200 rounded" />
    </div>
  )
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load leaderboard')
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

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-lucky-red">排行榜</h2>
        <p className="text-sm text-gray-500 mt-1">累積積分排名</p>
      </div>

      {loading || !data ? (
        <div className="space-y-2">
          {/* Skeleton podium */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : (
        <>
          {(() => {
            // Build display list: fill up to 5 slots
            const DISPLAY_SLOTS = 5
            const medals = ['gold', 'silver', 'bronze'] as const
            const medalIcons = ['🥇', '🥈', '🥉']
            const slots = Array.from({ length: DISPLAY_SLOTS }, (_, i) => {
              const entry = data.leaderboard[i] ?? null
              return { rank: i + 1, entry }
            })

            return (
              <>
                {/* Podium - Top 3 */}
                <div className="grid grid-cols-3 gap-2 mb-6 items-end">
                  {[1, 0, 2].map((slotIdx) => {
                    const { entry } = slots[slotIdx]
                    const medal = medals[slotIdx]
                    if (entry) {
                      return <PodiumCard key={slotIdx} entry={entry} medal={medal} />
                    }
                    // Empty podium placeholder
                    const c = {
                      gold: { bg: 'bg-gradient-to-b from-imperial-gold-100 to-imperial-gold-50', border: 'border-imperial-gold' },
                      silver: { bg: 'bg-gradient-to-b from-gray-100 to-gray-50', border: 'border-gray-300' },
                      bronze: { bg: 'bg-gradient-to-b from-orange-100 to-orange-50', border: 'border-orange-300' },
                    }[medal]
                    return (
                      <div key={slotIdx} className={`flex flex-col items-center p-3 rounded-xl border-2 ${c.bg} ${c.border}`}>
                        <span className="text-2xl mb-1">{medalIcons[slotIdx]}</span>
                        <div className="w-12 h-12 rounded-full bg-gray-200/60 flex items-center justify-center">
                          <span className="text-gray-400 text-lg">?</span>
                        </div>
                        <p className="mt-2 text-sm font-bold text-gray-300">---</p>
                        <p className="text-lg font-bold text-gray-300">- 分</p>
                      </div>
                    )
                  })}
                </div>

                {/* 4th & 5th slots */}
                <div className="cny-card overflow-hidden">
                  {slots.slice(3).map(({ rank, entry }) => (
                    <div
                      key={rank}
                      className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                        entry?.isCurrentUser ? 'bg-lucky-red-50' : ''
                      }`}
                    >
                      <span className="w-8 text-center font-bold text-sm text-imperial-gold-600">
                        {rank}
                      </span>
                      {entry ? (
                        <>
                          <Avatar src={entry.pictureUrl} name={entry.displayName} size={32} />
                          <span className="flex-1 text-sm font-medium truncate">
                            {entry.displayName}
                            {entry.isCurrentUser && (
                              <span className="ml-1 text-xs text-lucky-red">(你)</span>
                            )}
                          </span>
                          <span className="text-sm font-bold text-imperial-gold-700">
                            {entry.totalPoints} 分
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gray-200/60 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">?</span>
                          </div>
                          <span className="flex-1 text-sm font-medium text-gray-300">---</span>
                          <span className="text-sm font-bold text-gray-300">- 分</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Remaining users beyond 5 */}
                {data.leaderboard.length > DISPLAY_SLOTS && (
                  <div className="cny-card overflow-hidden mt-3">
                    {data.leaderboard.slice(DISPLAY_SLOTS).map((entry) => (
                      <div
                        key={entry.rank}
                        className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                          entry.isCurrentUser ? 'bg-lucky-red-50' : ''
                        }`}
                      >
                        <span className={`w-8 text-center font-bold text-sm ${
                          entry.rank <= 10 ? 'text-imperial-gold-600' : 'text-gray-400'
                        }`}>
                          {entry.rank}
                        </span>
                        <Avatar src={entry.pictureUrl} name={entry.displayName} size={32} />
                        <span className="flex-1 text-sm font-medium truncate">
                          {entry.displayName}
                          {entry.isCurrentUser && (
                            <span className="ml-1 text-xs text-lucky-red">(你)</span>
                          )}
                        </span>
                        <span className="text-sm font-bold text-imperial-gold-700">
                          {entry.totalPoints} 分
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          })()}

          {/* Current user's rank if not in top 50 */}
          {!data.leaderboard.some((e) => e.isCurrentUser) && (
            <div className="mt-4 cny-card p-4 bg-lucky-red-50 border-lucky-red-200">
              <p className="text-center text-sm">
                你的排名: <span className="font-bold text-lucky-red text-lg">第 {data.myRank} 名</span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
