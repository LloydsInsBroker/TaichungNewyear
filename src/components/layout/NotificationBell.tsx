'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: string
  message: string
  photoId: string | null
  isRead: boolean
  createdAt: string
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fetch unread count on mount
  useEffect(() => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        setUnreadCount(data.unreadCount ?? 0)
        setNotifications(data.notifications ?? [])
      })
      .catch(() => {})
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  async function toggleDropdown() {
    if (!isOpen) {
      // Opening: fetch latest and mark all read
      setLoading(true)
      try {
        const res = await fetch('/api/notifications')
        const data = await res.json()
        setNotifications(data.notifications ?? [])
        setUnreadCount(data.unreadCount ?? 0)

        if (data.unreadCount > 0) {
          await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markAllRead: true }),
          })
          setUnreadCount(0)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    setIsOpen(!isOpen)
  }

  function handleNotificationClick(notification: Notification) {
    setIsOpen(false)
    if (notification.photoId) {
      router.push('/photos')
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return '剛剛'
    if (diffMin < 60) return `${diffMin} 分鐘前`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour} 小時前`
    const diffDay = Math.floor(diffHour / 24)
    return `${diffDay} 天前`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-1 text-white hover:text-imperial-gold-200 transition-colors"
        aria-label="通知"
      >
        {/* Bell icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 004.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
        </svg>
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
          <div className="px-3 py-2 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">通知</span>
          </div>
          {loading ? (
            <div className="px-3 py-4 text-center text-sm text-gray-400">載入中...</div>
          ) : notifications.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-gray-400">沒有通知</div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleNotificationClick(n)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <p className={`text-sm ${n.isRead ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatTime(n.createdAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
