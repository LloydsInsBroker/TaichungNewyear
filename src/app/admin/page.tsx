'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Stats {
  totalUsers: number
  totalTaskCompletions: number
  totalPhotoUploads: number
  totalPointsAwarded: number
  activeLotteryTickets: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch stats')
        return res.json()
      })
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

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

  const cards = [
    { label: '總用戶數', value: stats!.totalUsers, href: '/admin/users' },
    { label: '任務完成數', value: stats!.totalTaskCompletions, href: '/admin/tasks' },
    { label: '照片上傳數', value: stats!.totalPhotoUploads, href: '#' },
    { label: '總發放積分', value: stats!.totalPointsAwarded, href: '#' },
    { label: '有效抽獎券', value: stats!.activeLotteryTickets, href: '/admin/lottery' },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">總覽</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-sm text-gray-500 mb-1">{card.label}</div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
          </Link>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-3">快速導航</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/admin/tasks"
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow text-center"
        >
          <div className="font-medium text-gray-900">任務管理</div>
          <div className="text-sm text-gray-500 mt-1">編輯每日任務</div>
        </Link>
        <Link
          href="/admin/users"
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow text-center"
        >
          <div className="font-medium text-gray-900">用戶管理</div>
          <div className="text-sm text-gray-500 mt-1">管理用戶與積分</div>
        </Link>
        <Link
          href="/admin/lottery"
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow text-center"
        >
          <div className="font-medium text-gray-900">抽獎管理</div>
          <div className="text-sm text-gray-500 mt-1">執行抽獎</div>
        </Link>
      </div>
    </div>
  )
}
