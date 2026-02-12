'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TOTAL_DAYS } from '@/lib/constants'

interface Task {
  id: string
  day: number
  date: string
  title: string
  taskType: string
  points: number
  isOpen: boolean
  completed: boolean
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/tasks')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load tasks')
        return res.json()
      })
      .then((data) => setTasks(data.tasks))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const completedCount = tasks.filter((t) => t.completed).length

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-lucky-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="cny-heading text-xl mb-2">每日任務</h2>
        <p className="text-imperial-gold-600 font-medium">
          已完成 {completedCount}/{TOTAL_DAYS} 任務
        </p>
        <div className="mt-2 w-full bg-imperial-gold-100 rounded-full h-2">
          <div
            className="bg-imperial-gold h-2 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / TOTAL_DAYS) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const locked = !task.isOpen

          if (task.completed) {
            return (
              <button
                key={task.id}
                onClick={() => router.push(`/tasks/${task.day}`)}
                className="relative w-full flex items-center gap-4 p-4 rounded-xl border-2 bg-green-50 border-green-300 shadow-sm transition-all duration-200 text-left"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-green-500 text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Day {task.day}
                    </span>
                    <span className="text-xs text-imperial-gold-500">{formatDate(task.date)}</span>
                  </div>
                  <h3 className="font-bold mt-1 truncate text-cny-dark">{task.title}</h3>
                </div>
                <div className="flex-shrink-0 text-right text-green-600">
                  <span className="text-sm font-bold">+{task.points}</span>
                  <span className="text-xs block">分</span>
                </div>
              </button>
            )
          }

          if (locked) {
            return (
              <div
                key={task.id}
                className="relative w-full flex items-center gap-4 p-4 rounded-xl border-2 border-lucky-red-700/30 bg-gradient-to-r from-lucky-red-800 to-lucky-red-900 shadow-md overflow-hidden"
              >
                {/* Decorative CNY pattern overlay */}
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, #cfb53b 1px, transparent 1px), radial-gradient(circle at 80% 50%, #cfb53b 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                  }}
                />

                {/* Red envelope seal */}
                <div className="relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-imperial-gold/90 shadow-lg">
                  <span className="text-2xl">🧧</span>
                </div>

                <div className="relative flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-lucky-red-700/50 text-imperial-gold-200">
                      Day {task.day}
                    </span>
                    <span className="text-xs text-imperial-gold-300/70">{formatDate(task.date)}</span>
                  </div>
                  <h3 className="font-bold mt-1 truncate text-imperial-gold-200/80 tracking-widest">
                    ？ ？ ？
                  </h3>
                  <p className="text-[10px] text-imperial-gold-300/50 mt-0.5">敬請期待</p>
                </div>

                <div className="relative flex-shrink-0 text-right text-imperial-gold-300/60">
                  <span className="text-sm font-bold">+{task.points}</span>
                  <span className="text-xs block">分</span>
                </div>
              </div>
            )
          }

          // Open & not completed
          return (
            <button
              key={task.id}
              onClick={() => router.push(`/tasks/${task.day}`)}
              className="relative w-full flex items-center gap-4 p-4 rounded-xl border-2 border-imperial-gold-200 bg-white shadow-md hover:shadow-lg hover:border-lucky-red-300 active:scale-[0.98] transition-all duration-200 text-left"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-lucky-red text-white">
                {task.day}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-lucky-red-50 text-lucky-red">
                    Day {task.day}
                  </span>
                  <span className="text-xs text-imperial-gold-500">{formatDate(task.date)}</span>
                </div>
                <h3 className="font-bold mt-1 truncate text-cny-dark">{task.title}</h3>
              </div>
              <div className="flex-shrink-0 text-right text-imperial-gold-500">
                <span className="text-sm font-bold">+{task.points}</span>
                <span className="text-xs block">分</span>
              </div>
              <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}
