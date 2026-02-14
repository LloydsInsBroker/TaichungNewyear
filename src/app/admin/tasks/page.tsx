'use client'

import { useEffect, useState } from 'react'

interface Task {
  id: string
  day: number
  title: string
  description: string
  taskType: string
  points: number
  date: string
  isOpen: boolean
  isClosed: boolean
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', points: 0 })
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<number | null>(null)
  const [closing, setClosing] = useState<number | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      setTasks(data.tasks)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function startEditing(task: Task) {
    setEditingDay(task.day)
    setEditForm({
      title: task.title,
      description: task.description,
      points: task.points,
    })
  }

  function cancelEditing() {
    setEditingDay(null)
  }

  async function saveTask(day: number) {
    setSaving(true)
    try {
      const res = await fetch(`/api/tasks/${day}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update task')
      }
      setEditingDay(null)
      await fetchTasks()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleOpen(task: Task) {
    setToggling(task.day)
    try {
      const res = await fetch(`/api/tasks/${task.day}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: !task.isOpen }),
      })
      if (!res.ok) throw new Error('Failed to toggle')
      await fetchTasks()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setToggling(null)
    }
  }

  async function toggleClosed(task: Task) {
    setClosing(task.day)
    try {
      const res = await fetch(`/api/tasks/${task.day}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isClosed: !task.isClosed }),
      })
      if (!res.ok) throw new Error('Failed to toggle')
      await fetchTasks()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setClosing(null)
    }
  }

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

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">任務管理</h2>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-4">
            {editingDay === task.day ? (
              /* Editing mode */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-500">Day {task.day}</span>
                  <span className="text-xs text-gray-400">{task.taskType}</span>
                </div>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="標題"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="說明"
                  rows={2}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600">積分:</label>
                  <input
                    type="number"
                    value={editForm.points}
                    onChange={(e) => setEditForm({ ...editForm, points: parseInt(e.target.value) || 0 })}
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveTask(task.day)}
                    disabled={saving}
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? '儲存中...' : '儲存'}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="text-sm bg-gray-100 text-gray-600 px-4 py-2 rounded hover:bg-gray-200"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              /* Display mode */
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-500">Day {task.day}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(task.date).toLocaleDateString('zh-TW')}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                      {task.taskType}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">+{task.points} 分</span>
                </div>

                <h3 className="font-bold text-gray-900 mb-1">{task.title}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description}</p>

                <div className="flex items-center justify-between gap-2">
                  {/* isOpen Toggle */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleOpen(task)}
                      disabled={toggling === task.day}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                        task.isOpen ? 'bg-green-500' : 'bg-gray-300'
                      } ${toggling === task.day ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          task.isOpen ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-medium ${task.isOpen ? 'text-green-600' : 'text-gray-400'}`}>
                      {task.isOpen ? '開放' : '未開放'}
                    </span>
                  </div>

                  {/* isClosed Toggle */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleClosed(task)}
                      disabled={closing === task.day}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                        task.isClosed ? 'bg-orange-500' : 'bg-gray-300'
                      } ${closing === task.day ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          task.isClosed ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-medium ${task.isClosed ? 'text-orange-600' : 'text-gray-400'}`}>
                      {task.isClosed ? '已截止' : '未截止'}
                    </span>
                  </div>

                  <button
                    onClick={() => startEditing(task)}
                    className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200"
                  >
                    編輯
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">尚無任務資料</div>
      )}
    </div>
  )
}
