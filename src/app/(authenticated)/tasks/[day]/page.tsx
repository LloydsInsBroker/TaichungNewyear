'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface TaskCompletion {
  displayName: string
  pictureUrl: string | null
  completedAt: string
}

interface TaskDetail {
  id: string
  day: number
  date: string
  title: string
  description: string
  taskType: 'CHECK_IN' | 'QUIZ' | 'TEXT_ANSWER' | 'MINI_GAME'
  taskConfig: Record<string, unknown> | null
  points: number
  isOpen: boolean
  completed: boolean
  completions: TaskCompletion[]
}

interface CompletionResult {
  success: boolean
  points: number
  newTickets: number
}

export default function TaskDayPage() {
  const params = useParams()
  const router = useRouter()
  const day = parseInt(params.day as string, 10)

  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState<CompletionResult | null>(null)

  // Quiz / text state
  const [selectedOption, setSelectedOption] = useState('')
  const [textAnswer, setTextAnswer] = useState('')

  useEffect(() => {
    if (isNaN(day)) {
      setError('Invalid day')
      setLoading(false)
      return
    }
    fetch(`/api/tasks/${day}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load task')
        return res.json()
      })
      .then((data) => setTask(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [day])

  async function handleSubmit() {
    if (!task || submitting) return
    setSubmitting(true)
    setSubmitError('')

    const body: Record<string, unknown> = {}
    if (task.taskType === 'QUIZ') body.answer = selectedOption
    if (task.taskType === 'TEXT_ANSWER') body.answer = textAnswer.trim()

    try {
      const res = await fetch(`/api/tasks/${day}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error || 'Submission failed')
        return
      }
      setResult(data)
      // Re-fetch task to update completions list
      const updated = await fetch(`/api/tasks/${day}`).then((r) => r.json())
      setTask(updated)
    } catch {
      setSubmitError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-lucky-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error || 'Task not found'}</p>
        <button onClick={() => router.push('/tasks')} className="cny-btn-primary text-sm">
          返回任務列表
        </button>
      </div>
    )
  }

  if (!task.isOpen) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium mb-4">尚未開放</p>
        <button onClick={() => router.push('/tasks')} className="cny-btn-primary text-sm">
          返回任務列表
        </button>
      </div>
    )
  }

  const config = task.taskConfig as Record<string, unknown> | null
  const quizOptions = (config?.options as string[]) ?? []
  const quizQuestion = (config?.question as string) ?? ''
  const minLength = (config?.minLength as number) ?? 1

  return (
    <div>
      <button
        onClick={() => router.push('/tasks')}
        className="flex items-center gap-1 text-lucky-red font-medium text-sm mb-4 hover:underline"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回任務列表
      </button>

      <div className="cny-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-imperial-gold-600 font-medium">
            Day {task.day}
          </span>
          <span className="text-sm text-imperial-gold-500 font-medium">
            +{task.points} 分
          </span>
        </div>

        <h2 className="cny-heading text-xl mb-2">{task.title}</h2>
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">{task.description}</p>

        {task.completed && !result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-700 font-bold">已完成</p>
          </div>
        )}

        {result && (
          <div className="bg-lucky-red-50 border border-lucky-red-200 rounded-lg p-5 text-center animate-bounce-in">
            <div className="w-12 h-12 cny-gradient rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lucky-red font-bold text-lg mb-1">恭喜完成!</p>
            <p className="text-imperial-gold-600 font-medium">
              獲得 {result.points} 分
            </p>
            {result.newTickets > 0 && (
              <p className="text-lucky-red font-bold mt-2 animate-bounce-in">
                獲得 {result.newTickets} 張抽獎券!
              </p>
            )}
          </div>
        )}

        {!task.completed && !result && (
          <>
            {/* CHECK_IN / MINI_GAME */}
            {(task.taskType === 'CHECK_IN' || task.taskType === 'MINI_GAME') && (
              <button onClick={handleSubmit} disabled={submitting} className="cny-btn-primary w-full">
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    處理中...
                  </span>
                ) : (
                  '簽到'
                )}
              </button>
            )}

            {/* QUIZ */}
            {task.taskType === 'QUIZ' && (
              <div>
                <p className="font-medium text-cny-dark mb-3">{quizQuestion}</p>
                <div className="space-y-2 mb-4">
                  {quizOptions.map((option, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedOption === option
                          ? 'border-lucky-red bg-lucky-red-50'
                          : 'border-gray-200 hover:border-imperial-gold-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="quiz"
                        value={option}
                        checked={selectedOption === option}
                        onChange={() => setSelectedOption(option)}
                        className="accent-lucky-red w-4 h-4"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedOption}
                  className="cny-btn-primary w-full"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      提交中...
                    </span>
                  ) : (
                    '提交答案'
                  )}
                </button>
              </div>
            )}

            {/* TEXT_ANSWER */}
            {task.taskType === 'TEXT_ANSWER' && (
              <div>
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="請輸入你的回答..."
                  rows={4}
                  className="w-full border-2 border-imperial-gold-200 rounded-lg p-3 text-sm focus:outline-none focus:border-lucky-red transition-colors resize-none"
                />
                <div className="flex justify-between items-center mt-1 mb-4">
                  <span className={`text-xs ${textAnswer.trim().length >= minLength ? 'text-green-500' : 'text-gray-400'}`}>
                    {textAnswer.trim().length}/{minLength} 字 (最少)
                  </span>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || textAnswer.trim().length < minLength}
                  className="cny-btn-primary w-full"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      提交中...
                    </span>
                  ) : (
                    '提交回答'
                  )}
                </button>
              </div>
            )}

            {submitError && (
              <p className="text-red-500 text-sm text-center mt-3">{submitError}</p>
            )}
          </>
        )}
      </div>

      {/* Completion list */}
      <div className="cny-card p-5 mt-4">
        <h3 className="font-bold text-cny-dark mb-3">
          已完成 ({task.completions.length}人)
        </h3>
        {task.completions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">尚無人完成</p>
        ) : (
          <ul className="space-y-3">
            {task.completions.map((c, idx) => (
              <li key={idx} className="flex items-center gap-3">
                {c.pictureUrl ? (
                  <img
                    src={c.pictureUrl}
                    alt={c.displayName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-imperial-gold-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-imperial-gold-600 text-xs font-bold">
                      {c.displayName.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-cny-dark truncate">
                  {c.displayName}
                </span>
                <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                  {new Date(c.completedAt).toLocaleString('zh-TW', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
