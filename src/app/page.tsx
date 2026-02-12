'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ACTIVITY_START, ACTIVITY_END } from '@/lib/constants'

function useCountdown() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!now) return { status: 'loading' as const, days: 0, hours: 0, minutes: 0, seconds: 0 }

  if (now > ACTIVITY_END) {
    return { status: 'ended' as const, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  if (now >= ACTIVITY_START) {
    return { status: 'active' as const, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  const diff = ACTIVITY_START.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { status: 'upcoming' as const, days, hours, minutes, seconds }
}

function CountdownDisplay() {
  const { status, days, hours, minutes, seconds } = useCountdown()

  if (status === 'loading') {
    return <div className="h-24" />
  }

  if (status === 'ended') {
    return (
      <div className="text-2xl md:text-3xl font-bold text-imperial-gold-100 mt-6">
        活動已結束
      </div>
    )
  }

  if (status === 'active') {
    return (
      <div className="text-2xl md:text-3xl font-bold text-imperial-gold-100 mt-6 animate-bounce-in">
        <span className="text-4xl md:text-5xl">🎉</span>
        <br />
        活動進行中！
      </div>
    )
  }

  const units = [
    { label: '天', value: days },
    { label: '時', value: hours },
    { label: '分', value: minutes },
    { label: '秒', value: seconds },
  ]

  return (
    <div className="mt-6">
      <p className="text-imperial-gold-200 text-sm md:text-base mb-3">距離活動開始</p>
      <div className="flex gap-3 md:gap-4 justify-center">
        {units.map((unit) => (
          <div key={unit.label} className="flex flex-col items-center">
            <div className="bg-lucky-red-800/60 backdrop-blur border border-imperial-gold-400/40 rounded-lg w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
              <span className="text-2xl md:text-3xl font-bold text-white">
                {String(unit.value).padStart(2, '0')}
              </span>
            </div>
            <span className="text-imperial-gold-200 text-xs md:text-sm mt-1">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FloatingEmojis() {
  const emojis = ['🧧', '🏮', '🎆', '💰', '🎊', '🧨', '🎇', '✨']
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {emojis.map((emoji, i) => (
        <span
          key={i}
          className="absolute text-2xl md:text-3xl animate-float opacity-40"
          style={{
            left: `${10 + i * 12}%`,
            top: `${15 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${3 + (i % 3)}s`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  )
}

const rules = [
  { icon: '🔑', text: '使用 LINE 帳號登入' },
  { icon: '✅', text: '每天完成任務獲得 2 分' },
  { icon: '📸', text: '上傳照片額外獲得 1 分' },
  { icon: '🎫', text: '每 6 分獲得 1 張抽獎券' },
  { icon: '🏆', text: '活動結束後抽出大獎！' },
]

const prizes = [
  { amount: '88', count: 5, highlight: false },
  { amount: '188', count: 3, highlight: false },
  { amount: '388', count: 2, highlight: false },
  { amount: '588', count: 2, highlight: false },
  { amount: '888', count: 2, highlight: false },
  { amount: '1,688', count: 1, highlight: true },
]

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      {/* ===== Hero Section ===== */}
      <section className="relative cny-gradient min-h-screen flex flex-col items-center justify-center px-4 py-16 text-center">
        <FloatingEmojis />

        {/* Lanterns */}
        <div className="absolute top-4 left-6 text-4xl md:text-5xl animate-lantern-swing origin-top">
          🏮
        </div>
        <div
          className="absolute top-4 right-6 text-4xl md:text-5xl animate-lantern-swing origin-top"
          style={{ animationDelay: '0.5s' }}
        >
          🏮
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="text-5xl md:text-6xl mb-4">🧧</div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-imperial-gold tracking-wider text-shadow-gold leading-tight">
            諾億保經台中分行
          </h1>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-imperial-gold-200 mt-2 tracking-wide">
            2026 新年限定活動
          </h2>
          <p className="text-imperial-gold-300 text-lg md:text-xl mt-4 tracking-wide">
            限時9天挑戰 | 2/14 ~ 2/22
          </p>

          <CountdownDisplay />

          <Link
            href="/tasks"
            className="cny-btn-gold inline-block mt-8 text-lg px-8 py-4 hover:scale-105 transition-transform"
          >
            立即參加
          </Link>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 text-imperial-gold-300 animate-float text-sm">
          <span className="block">往下了解更多</span>
          <span className="block text-xl mt-1">↓</span>
        </div>
      </section>

      {/* ===== Rules Section ===== */}
      <section className="bg-cny-dark py-16 md:py-20 px-4" id="rules">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-imperial-gold text-3xl md:text-4xl text-center font-bold mb-4">活動規則</h2>
          <div className="w-24 h-1 cny-gold-gradient mx-auto rounded-full mb-10" />

          <div className="space-y-4">
            {rules.map((rule, index) => (
              <div
                key={index}
                className="bg-lucky-red-900/40 border border-lucky-red-700/50 rounded-xl p-5 md:p-6 flex items-center gap-4 backdrop-blur"
              >
                <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-lucky-red/30 border border-lucky-red-600/50 rounded-full flex items-center justify-center">
                  <span className="text-2xl md:text-3xl">{rule.icon}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-imperial-gold font-bold text-lg">{index + 1}.</span>
                  <span className="text-gray-100 text-base md:text-lg font-medium">{rule.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Prizes Section ===== */}
      <section className="cny-gradient py-16 md:py-20 px-4" id="prizes">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-imperial-gold text-3xl md:text-4xl text-center font-bold mb-4">精彩獎品</h2>
          <div className="w-24 h-1 cny-gold-gradient mx-auto rounded-full mb-10" />

          {/* 紅包獎品 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {prizes.map((prize, index) => (
              <div
                key={index}
                className={`relative rounded-xl p-6 text-center border-2 transition-transform hover:scale-105 ${
                  prize.highlight
                    ? 'bg-gradient-to-b from-imperial-gold-600 to-imperial-gold-800 border-imperial-gold-300 shadow-lg shadow-imperial-gold/30 col-span-2 md:col-span-1'
                    : 'bg-lucky-red-800/60 border-lucky-red-600/50'
                }`}
              >
                {prize.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-imperial-gold text-cny-dark text-xs font-black px-4 py-1 rounded-full">
                    最大獎
                  </div>
                )}
                <div className="text-4xl md:text-5xl mb-3">🧧</div>
                <div className={`text-2xl md:text-3xl font-black mb-1 ${
                  prize.highlight ? 'text-white' : 'text-imperial-gold'
                }`}>
                  ${prize.amount}
                </div>
                <div className={`text-sm ${
                  prize.highlight ? 'text-imperial-gold-100' : 'text-lucky-red-200'
                }`}>
                  紅包 x {prize.count}
                </div>
              </div>
            ))}
          </div>

          {/* 限時抽獎 - 高亮閃爍 */}
          <div className="relative mt-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-imperial-gold via-yellow-300 to-imperial-gold rounded-2xl blur-md opacity-60 animate-pulse" />
            <div className="relative bg-gradient-to-r from-lucky-red-800 via-lucky-red-700 to-lucky-red-800 border-2 border-imperial-gold rounded-2xl p-6 md:p-8 text-center overflow-hidden">
              {/* Sparkle effects */}
              <div className="absolute top-2 left-4 text-xl animate-sparkle">✨</div>
              <div className="absolute top-3 right-6 text-lg animate-sparkle" style={{ animationDelay: '0.5s' }}>✨</div>
              <div className="absolute bottom-2 left-8 text-lg animate-sparkle" style={{ animationDelay: '1s' }}>✨</div>
              <div className="absolute bottom-3 right-4 text-xl animate-sparkle" style={{ animationDelay: '0.3s' }}>✨</div>

              <div className="relative z-10">
                <div className="text-5xl md:text-6xl mb-3 animate-bounce-in">🎰</div>
                <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text cny-gold-gradient animate-pulse">
                  限時抽獎
                </h3>
                <p className="text-imperial-gold-200 mt-2 text-base md:text-lg">
                  活動期間限定，驚喜大獎等你來拿！
                </p>
                <div className="mt-4 inline-flex items-center gap-2 bg-imperial-gold/20 border border-imperial-gold/40 rounded-full px-5 py-2">
                  <span className="animate-sparkle text-imperial-gold">🌟</span>
                  <span className="text-imperial-gold font-bold text-sm">積分越高，中獎機率越大</span>
                  <span className="animate-sparkle text-imperial-gold" style={{ animationDelay: '0.6s' }}>🌟</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-lucky-red-200/60 text-sm mt-8">
            * 紅包獎品將於活動結束後統一發放
          </p>
        </div>
      </section>

      {/* ===== Footer / CTA Section ===== */}
      <section className="bg-cny-dark py-16 md:py-20 px-4 text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-4 left-1/4 text-3xl animate-sparkle opacity-60">✨</div>
        <div className="absolute top-8 right-1/4 text-2xl animate-sparkle opacity-50" style={{ animationDelay: '0.7s' }}>✨</div>
        <div className="absolute bottom-6 left-1/3 text-2xl animate-sparkle opacity-40" style={{ animationDelay: '1.2s' }}>🎆</div>

        <div className="relative z-10 max-w-xl mx-auto">
          <h2 className="text-imperial-gold text-3xl md:text-4xl font-bold mb-4 text-shadow-gold">
            準備好迎接挑戰了嗎？
          </h2>
          <p className="text-gray-400 mb-8 text-base md:text-lg">
            加入團隊活動，完成每日任務，贏取豐富獎品！
          </p>
          <Link
            href="/tasks"
            className="cny-btn-gold inline-block text-lg px-10 py-4 hover:scale-105 transition-transform"
          >
            立即加入
          </Link>

          <div className="mt-12 text-lucky-red-700/60 text-sm">
            <span>🧧</span>
            <span className="mx-2">恭喜發財</span>
            <span>🧧</span>
            <span className="mx-2">萬事如意</span>
            <span>🧧</span>
          </div>
        </div>
      </section>
    </main>
  )
}
