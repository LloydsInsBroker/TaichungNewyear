'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface BonusDrawAnimationProps {
  users: { displayName: string; pictureUrl: string | null }[]
  winner: { displayName: string; pictureUrl: string | null }
  prizeName: string
  onConfirm: () => void
  onRedraw: () => void
  onClose: () => void
}

export default function BonusDrawAnimation({
  users,
  winner,
  prizeName,
  onConfirm,
  onRedraw,
  onClose,
}: BonusDrawAnimationProps) {
  const [phase, setPhase] = useState<'spinning' | 'slowing' | 'revealed'>('spinning')
  const scrollRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const offsetRef = useRef(0)
  const speedRef = useRef(20) // pixels per frame
  const itemHeight = 72

  // Build a looping list: repeat users enough to have smooth scrolling
  const extendedUsers = [...users, ...users, ...users, ...users, ...users]
  // Place the winner at a target position at the end
  const winnerIndex = extendedUsers.length - users.length + Math.floor(users.length / 2)
  extendedUsers[winnerIndex] = winner

  const totalHeight = extendedUsers.length * itemHeight

  const animate = useCallback(() => {
    if (!scrollRef.current) return

    offsetRef.current += speedRef.current

    // Wrap around
    if (offsetRef.current >= totalHeight / 2) {
      offsetRef.current -= totalHeight / 2
    }

    scrollRef.current.style.transform = `translateY(-${offsetRef.current}px)`
    animRef.current = requestAnimationFrame(animate)
  }, [totalHeight])

  useEffect(() => {
    // Phase 1: Fast spinning for 2.5s
    animRef.current = requestAnimationFrame(animate)

    const slowTimer = setTimeout(() => {
      setPhase('slowing')
      // Phase 2: Decelerate over ~2.5s to stop at winner
      cancelAnimationFrame(animRef.current)

      const targetOffset = winnerIndex * itemHeight - itemHeight * 2 // center the winner
      // Calculate total distance to travel during deceleration
      let currentOffset = offsetRef.current
      // Make sure we travel forward enough
      if (targetOffset <= currentOffset) {
        // Need to go around at least once more
        const extra = totalHeight / 2
        const totalDistance = targetOffset + extra - currentOffset
        decelerateToTarget(totalDistance, currentOffset)
      } else {
        // Add extra loops for dramatic effect
        const extra = totalHeight / 2
        const totalDistance = targetOffset + extra - currentOffset
        decelerateToTarget(totalDistance, currentOffset)
      }
    }, 2500)

    return () => {
      clearTimeout(slowTimer)
      cancelAnimationFrame(animRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function decelerateToTarget(totalDistance: number, startOffset: number) {
    const duration = 2500 // ms
    const startTime = performance.now()

    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3)
    }

    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)

      let newOffset = startOffset + totalDistance * eased
      // Wrap
      while (newOffset >= totalHeight / 2) {
        newOffset -= totalHeight / 2
      }

      offsetRef.current = newOffset
      if (scrollRef.current) {
        scrollRef.current.style.transform = `translateY(-${newOffset}px)`
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step)
      } else {
        setPhase('revealed')
      }
    }

    animRef.current = requestAnimationFrame(step)
  }

  // Firework particles for reveal
  const fireworks = phase === 'revealed' ? Array.from({ length: 12 }, (_, i) => i) : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-red-900/80 backdrop-blur-sm" onClick={onClose} />

      {/* Decorative lanterns */}
      <div className="absolute top-4 left-8 text-4xl animate-lantern-swing origin-top">🏮</div>
      <div className="absolute top-4 right-8 text-4xl animate-lantern-swing origin-top" style={{ animationDelay: '0.5s' }}>🏮</div>

      {/* Gold particles */}
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute w-2 h-2 rounded-full bg-yellow-400 animate-float opacity-60"
          style={{
            left: `${10 + i * 12}%`,
            top: `${15 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 w-[320px] max-w-[90vw] mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-yellow-300 drop-shadow-lg">
            🎆 限時加碼抽獎 🎆
          </h2>
          <p className="text-yellow-100/80 text-sm mt-1">獎品：{prizeName}</p>
        </div>

        {/* Slot machine window */}
        <div className="bg-gradient-to-b from-red-800 to-red-900 rounded-2xl border-4 border-yellow-500 shadow-2xl overflow-hidden">
          {/* Gold trim top */}
          <div className="h-2 bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600" />

          <div className="relative h-[360px] overflow-hidden">
            {/* Fade masks */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-red-900 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-red-900 to-transparent z-10 pointer-events-none" />

            {/* Center highlight line */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[72px] border-y-2 border-yellow-400/60 bg-yellow-400/10 z-10 pointer-events-none" />

            {/* Scrolling names */}
            <div className="relative h-full flex items-start justify-center pt-[144px]">
              <div ref={scrollRef} className="will-change-transform">
                {extendedUsers.map((user, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 px-6 h-[72px] transition-none ${
                      phase === 'revealed' && idx === winnerIndex
                        ? 'bg-yellow-400/20'
                        : ''
                    }`}
                  >
                    {user.pictureUrl ? (
                      <img
                        src={user.pictureUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border-2 border-yellow-400/50 flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-yellow-400/30 flex items-center justify-center flex-shrink-0 border-2 border-yellow-400/50">
                        <span className="text-yellow-200 font-bold text-sm">
                          {user.displayName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="text-white font-bold text-lg truncate">
                      {user.displayName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gold trim bottom */}
          <div className="h-2 bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600" />
        </div>

        {/* Revealed state */}
        {phase === 'revealed' && (
          <div className="mt-4 animate-bounce-in">
            {/* Fireworks */}
            {fireworks.map((i) => (
              <div
                key={`fw-${i}`}
                className="absolute w-4 h-4 rounded-full"
                style={{
                  left: `${20 + (i % 4) * 20}%`,
                  top: `${10 + Math.floor(i / 4) * 30}%`,
                  background: ['#FFD700', '#FF6B6B', '#FF4500', '#FFE066'][i % 4],
                  animation: `firework 1.5s ease-out ${i * 0.1}s infinite`,
                }}
              />
            ))}

            {/* Winner announcement */}
            <div className="bg-gradient-to-b from-red-700 to-red-800 rounded-2xl border-2 border-yellow-400 p-5 text-center shadow-xl">
              <p className="text-3xl mb-2">🎊</p>
              <p className="text-yellow-300 text-xl font-bold mb-2">恭喜</p>
              <div className="flex items-center justify-center gap-3 mb-2">
                {winner.pictureUrl ? (
                  <img
                    src={winner.pictureUrl}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover border-3 border-yellow-400 shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-yellow-400/30 flex items-center justify-center border-3 border-yellow-400">
                    <span className="text-yellow-200 font-bold text-xl">
                      {winner.displayName.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-white text-2xl font-bold">{winner.displayName}</span>
              </div>
              <p className="text-yellow-200 text-sm">獲得 {prizeName}</p>
              <p className="text-3xl mt-2">🧧</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={onRedraw}
                className="flex-1 py-3 rounded-xl bg-white/10 border border-yellow-400/40 text-yellow-200 font-bold text-sm hover:bg-white/20 transition-colors"
              >
                重新抽獎
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 rounded-xl bg-yellow-500 text-red-900 font-bold text-sm hover:bg-yellow-400 transition-colors shadow-lg"
              >
                確認本次抽獎
              </button>
            </div>
          </div>
        )}

        {/* Spinning indicator */}
        {phase !== 'revealed' && (
          <div className="text-center mt-4">
            <p className="text-yellow-200/70 text-sm animate-pulse">
              {phase === 'spinning' ? '抽獎中...' : '即將揭曉...'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
