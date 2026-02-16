'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ScratchCard from '@/components/ScratchCard'

interface TaskCompletion {
  displayName: string
  pictureUrl: string | null
  completedAt: string
  answer?: string
}

interface TaskDetail {
  id: string
  day: number
  date: string
  title: string
  description: string
  taskType: 'CHECK_IN' | 'QUIZ' | 'TEXT_ANSWER' | 'MINI_GAME' | 'PHOTO_UPLOAD'
  taskConfig: Record<string, unknown> | null
  points: number
  isOpen: boolean
  isClosed: boolean
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
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [textAnswer, setTextAnswer] = useState('')

  // Scratch card state
  const [scratchCard, setScratchCard] = useState<{
    hasCard: boolean
    isScratched?: boolean
    isWinner?: boolean
    prizeName?: string | null
  } | null>(null)

  // Photo upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchScratchCard = useCallback(() => {
    fetch(`/api/tasks/${day}/scratch-card`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setScratchCard(data) })
      .catch(() => {})
  }, [day])

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
      .then((data) => {
        setTask(data)
        if (data.completed && data.isClosed) {
          fetchScratchCard()
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [day, fetchScratchCard])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handlePhotoSubmit() {
    if (!task || !selectedFile || uploading) return
    setUploading(true)
    setSubmitError('')

    try {
      // 1. Get signed upload URL
      const urlRes = await fetch('/api/photos/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedFile.name, contentType: selectedFile.type }),
      })
      if (!urlRes.ok) throw new Error('Failed to get upload URL')
      const { uploadUrl, gcsKey } = await urlRes.json()

      // 2. Upload to GCS
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      })
      if (!uploadRes.ok) throw new Error('Failed to upload photo')

      // 3. Build proxy URL and complete task
      const proxyUrl = `/api/photos/serve/${btoa(gcsKey)}`
      const res = await fetch(`/api/tasks/${day}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: proxyUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error || 'Submission failed')
        return
      }
      setResult(data)
      const updated = await fetch(`/api/tasks/${day}`).then((r) => r.json())
      setTask(updated)
    } catch {
      setSubmitError('上傳失敗，請重試')
    } finally {
      setUploading(false)
    }
  }

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
  const textPlaceholder = (config?.placeholder as string) ?? '請輸入你的回答...'

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

        {task.completed && task.isClosed && scratchCard?.hasCard && (
          <ScratchCard
            day={day}
            hasCard={scratchCard.hasCard}
            isScratched={scratchCard.isScratched ?? false}
            isWinner={scratchCard.isWinner}
            prizeName={scratchCard.prizeName}
            onScratch={async () => {
              const res = await fetch(`/api/tasks/${day}/scratch-card`, { method: 'POST' })
              const data = await res.json()
              if (!res.ok) throw new Error(data.error)
              setScratchCard({ hasCard: true, isScratched: true, isWinner: data.isWinner, prizeName: data.prizeName })
              return data
            }}
          />
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

        {task.isClosed && !task.completed && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-orange-700 font-bold">此任務已截止</p>
          </div>
        )}

        {!task.completed && !task.isClosed && !result && (
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
                        selectedOption === idx
                          ? 'border-lucky-red bg-lucky-red-50'
                          : 'border-gray-200 hover:border-imperial-gold-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="quiz"
                        value={idx}
                        checked={selectedOption === idx}
                        onChange={() => setSelectedOption(idx)}
                        className="accent-lucky-red w-4 h-4"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || selectedOption === null}
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
                  placeholder={textPlaceholder}
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

            {/* PHOTO_UPLOAD */}
            {task.taskType === 'PHOTO_UPLOAD' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {!photoPreview ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-imperial-gold-300 rounded-lg p-8 flex flex-col items-center gap-2 hover:border-lucky-red hover:bg-lucky-red-50 transition-colors"
                  >
                    <svg className="w-10 h-10 text-imperial-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                    <span className="text-sm text-imperial-gold-600 font-medium">點擊上傳照片</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <img
                      src={photoPreview}
                      alt="預覽"
                      className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedFile(null)
                          setPhotoPreview(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="flex-1 py-2 rounded-lg border-2 border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50"
                      >
                        重新選擇
                      </button>
                      <button
                        onClick={handlePhotoSubmit}
                        disabled={uploading}
                        className="flex-1 cny-btn-primary"
                      >
                        {uploading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            上傳中...
                          </span>
                        ) : (
                          '提交照片'
                        )}
                      </button>
                    </div>
                  </div>
                )}
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
              <li key={idx} className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
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
                </div>
                {task.taskType === 'TEXT_ANSWER' && c.answer && (
                  <p className="text-xs text-gray-500 ml-11">
                    &ldquo;{c.answer}&rdquo;
                  </p>
                )}
                {task.taskType === 'PHOTO_UPLOAD' && c.answer && (
                  <div className="ml-11 mt-1">
                    <img
                      src={c.answer}
                      alt={`${c.displayName} 的照片`}
                      className="w-full max-w-[200px] rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
