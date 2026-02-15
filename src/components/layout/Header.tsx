'use client'

import Link from 'next/link'
import NotificationBell from './NotificationBell'

export default function Header({ totalPoints }: { totalPoints: number }) {
  return (
    <header className="cny-gradient text-white py-3 px-4 flex items-center justify-between sticky top-0 z-40">
      <Link href="/" className="text-sm font-bold hover:text-imperial-gold-200 transition-colors">🧧 諾億台中 2026 新年限定活動</Link>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <span className="text-imperial-gold-200 text-sm font-medium">
          {totalPoints} 分
        </span>
      </div>
    </header>
  )
}
