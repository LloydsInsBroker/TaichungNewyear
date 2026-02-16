'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

interface PhotoUser {
  displayName: string
  pictureUrl: string | null
}

interface Photo {
  id: string
  imageUrl: string
  gcsKey: string
  caption: string | null
  createdAt: string
  user: PhotoUser
  _count: { comments: number }
}

interface Comment {
  id: string
  text: string
  createdAt: string
  user: PhotoUser
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 10

// Randomized rotation classes for playful layout
const ROTATIONS = [
  'rotate-[-2deg]',
  'rotate-[1.5deg]',
  'rotate-[-1deg]',
  'rotate-[2.5deg]',
  'rotate-[-3deg]',
  'rotate-[1deg]',
  'rotate-[-2.5deg]',
  'rotate-[3deg]',
]

export default function PhotosPage() {
  const searchParams = useSearchParams()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [viewPhoto, setViewPhoto] = useState<Photo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Comment state
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPhotos(page)
  }, [page])

  // Auto-open lightbox when photoId is in URL
  useEffect(() => {
    const photoId = searchParams.get('photoId')
    if (!photoId) return
    // Check if already loaded in current page
    const found = photos.find((p) => p.id === photoId)
    if (found) {
      setViewPhoto(found)
      return
    }
    // Fetch single photo if not in current page
    if (!loading) {
      fetch(`/api/photos/${photoId}`)
        .then((res) => {
          if (!res.ok) throw new Error()
          return res.json()
        })
        .then((photo) => setViewPhoto(photo))
        .catch(() => {})
    }
  }, [searchParams, photos, loading])

  const fetchComments = useCallback(async (photoId: string) => {
    setCommentsLoading(true)
    try {
      const res = await fetch(`/api/photos/${photoId}/comments`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setComments(data.comments)
    } catch {
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }, [])

  // Fetch comments when lightbox opens
  useEffect(() => {
    if (viewPhoto) {
      fetchComments(viewPhoto.id)
      setNewComment('')
    } else {
      setComments([])
    }
  }, [viewPhoto, fetchComments])

  // Scroll to bottom when new comments appear
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function fetchPhotos(p: number) {
    setLoading(true)
    try {
      const res = await fetch(`/api/photos?page=${p}&limit=20`)
      if (!res.ok) throw new Error('Failed to fetch photos')
      const data = await res.json()
      setPhotos(data.photos)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      setErrorMsg('載入照片失敗')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitComment() {
    if (!viewPhoto || !newComment.trim() || submittingComment) return
    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/photos/${viewPhoto.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment.trim() }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      // Optimistic append
      setComments((prev) => [...prev, data.comment])
      setNewComment('')
      // Update _count in photos list and viewPhoto
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === viewPhoto.id
            ? { ...p, _count: { comments: p._count.comments + 1 } }
            : p,
        ),
      )
      setViewPhoto((prev) =>
        prev ? { ...prev, _count: { comments: prev._count.comments + 1 } } : prev,
      )
    } catch {
      // silently fail for small team app
    } finally {
      setSubmittingComment(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setErrorMsg('')
    setSuccessMsg('')
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg('請選擇 JPEG、PNG 或 WebP 格式的圖片')
      return
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`檔案大小不能超過 ${MAX_SIZE_MB}MB`)
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function cancelUpload() {
    setSelectedFile(null)
    setPreview(null)
    setCaption('')
    setErrorMsg('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const urlRes = await fetch('/api/photos/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type,
        }),
      })

      if (!urlRes.ok) {
        const errBody = await urlRes.text()
        throw new Error(`取得上傳網址失敗 (${urlRes.status}): ${errBody}`)
      }

      const { uploadUrl, gcsKey, publicUrl } = await urlRes.json()

      let uploadRes: Response
      try {
        uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': selectedFile.type },
          body: selectedFile,
          mode: 'cors',
        })
      } catch (fetchErr) {
        throw new Error(`上傳失敗 (網路錯誤): ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`)
      }

      if (!uploadRes.ok) {
        const errText = await uploadRes.text()
        throw new Error(`上傳失敗 (${uploadRes.status}): ${errText.substring(0, 200)}`)
      }

      const confirmRes = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gcsKey,
          imageUrl: publicUrl,
          caption: caption.trim() || undefined,
        }),
      })

      if (!confirmRes.ok) {
        const errBody = await confirmRes.text()
        throw new Error(`確認上傳失敗 (${confirmRes.status}): ${errBody}`)
      }

      const result = await confirmRes.json()

      setSuccessMsg(
        `上傳成功！+${result.points} 分` +
        (result.newTickets > 0 ? `，獲得 ${result.newTickets} 張新抽獎券！` : '')
      )

      cancelUpload()
      setPage(1)
      fetchPhotos(1)
    } catch (err) {
      const message = err instanceof Error ? err.message : '上傳失敗'
      setErrorMsg(message)
    } finally {
      setUploading(false)
    }
  }

  function timeAgo(dateStr: string) {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const diff = now - then
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '剛剛'
    if (mins < 60) return `${mins} 分鐘前`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} 小時前`
    const days = Math.floor(hrs / 24)
    return `${days} 天前`
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center">
        <h2 className="cny-heading text-2xl mb-1">活動照片牆</h2>
        <p className="text-sm text-imperial-gold-600">
          分享你的新年歡樂時刻 · 上傳照片 +3 分
        </p>
        {total > 0 && (
          <p className="text-xs text-imperial-gold-400 mt-1">
            已有 {total} 張照片
          </p>
        )}
      </div>

      {/* Upload Area */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />

        {!preview ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-5 rounded-2xl border-2 border-dashed border-lucky-red-300 bg-lucky-red-50/50 hover:bg-lucky-red-50 transition-colors flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full cny-gradient flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-lucky-red font-bold text-sm">上傳照片</span>
            <span className="text-xs text-lucky-red-400">支援 JPG、PNG、WebP（最大 10MB）</span>
          </button>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-imperial-gold-200 shadow-lg p-4 space-y-3">
            <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-gray-100">
              <img
                src={preview}
                alt="預覽"
                className="w-full h-full object-cover"
              />
            </div>
            <input
              type="text"
              placeholder="說點什麼... (選填)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
              className="w-full border-2 border-imperial-gold-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-lucky-red-300 transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={cancelUpload}
                disabled={uploading}
                className="flex-1 py-2.5 rounded-full border-2 border-gray-300 text-gray-600 font-bold text-sm disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="cny-btn-primary flex-1 text-sm py-2.5"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    上傳中...
                  </span>
                ) : (
                  '分享照片'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-bounce-in">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm animate-bounce-in">
          {successMsg}
        </div>
      )}

      {/* Photo Wall */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-lucky-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📸</div>
          <p className="text-imperial-gold-600 font-bold">還沒有照片</p>
          <p className="text-sm text-imperial-gold-400 mt-1">成為第一個分享的人吧！</p>
        </div>
      ) : (
        <>
          {/* Masonry-like scattered photo wall */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            {photos.map((photo, idx) => {
              const rotation = ROTATIONS[idx % ROTATIONS.length]
              const isOdd = idx % 2 === 1

              return (
                <div
                  key={photo.id}
                  className={`relative ${rotation} ${isOdd ? 'mt-4' : ''} hover:!rotate-0 hover:scale-105 transition-all duration-300 cursor-pointer`}
                  onClick={() => setViewPhoto(photo)}
                >
                  {/* Photo card - polaroid style */}
                  <div className="bg-white rounded-xl shadow-lg border border-imperial-gold-100 p-1.5 pb-2">
                    {/* Photo */}
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={photo.imageUrl}
                        alt={photo.caption || '照片'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Caption */}
                    {photo.caption && (
                      <p className="text-[11px] text-gray-600 mt-1.5 px-1 line-clamp-2 leading-tight">
                        {photo.caption}
                      </p>
                    )}

                    {/* Time & Comment count */}
                    <div className="flex items-center justify-between mt-1 px-1">
                      <p className="text-[10px] text-gray-400">
                        {timeAgo(photo.createdAt)}
                      </p>
                      {photo._count.comments > 0 && (
                        <div className="flex items-center gap-0.5 text-[10px] text-imperial-gold-500">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>{photo._count.comments}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Avatar - overlapping top-right of the photo card */}
                  <div className="absolute -top-3 -right-2 z-10">
                    <div className="relative">
                      {photo.user.pictureUrl ? (
                        <img
                          src={photo.user.pictureUrl}
                          alt={photo.user.displayName}
                          className="w-9 h-9 rounded-full border-[3px] border-white shadow-md object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full border-[3px] border-white shadow-md bg-gradient-to-br from-lucky-red to-lucky-red-700 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {photo.user.displayName.charAt(0)}
                          </span>
                        </div>
                      )}
                      {/* Tiny name tag */}
                      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-[8px] bg-lucky-red text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                          {photo.user.displayName.length > 4
                            ? photo.user.displayName.slice(0, 4) + '…'
                            : photo.user.displayName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-full text-sm font-bold border-2 border-lucky-red-200 text-lucky-red disabled:opacity-30 disabled:cursor-not-allowed hover:bg-lucky-red-50 transition-colors"
              >
                上一頁
              </button>
              <span className="text-sm text-imperial-gold-600 font-medium">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-full text-sm font-bold border-2 border-lucky-red-200 text-lucky-red disabled:opacity-30 disabled:cursor-not-allowed hover:bg-lucky-red-50 transition-colors"
              >
                下一頁
              </button>
            </div>
          )}

          <p className="text-center text-xs text-imperial-gold-400 pb-2">
            共 {total} 張照片
          </p>
        </>
      )}

      {/* Photo Lightbox */}
      {viewPhoto && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewPhoto(null)}
        >
          <div
            className="relative bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl animate-bounce-in max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setViewPhoto(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Photo */}
            <div className="w-full shrink-0">
              <img
                src={viewPhoto.imageUrl}
                alt={viewPhoto.caption || '照片'}
                className="w-full max-h-[40vh] object-contain bg-gray-100"
              />
            </div>

            {/* Info + Comments - scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  {viewPhoto.user.pictureUrl ? (
                    <img
                      src={viewPhoto.user.pictureUrl}
                      alt={viewPhoto.user.displayName}
                      className="w-10 h-10 rounded-full border-2 border-lucky-red-200 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full border-2 border-lucky-red-200 bg-gradient-to-br from-lucky-red to-lucky-red-700 flex items-center justify-center">
                      <span className="text-white font-bold">
                        {viewPhoto.user.displayName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-cny-dark truncate">
                      {viewPhoto.user.displayName}
                    </p>
                    <p className="text-xs text-gray-400">{timeAgo(viewPhoto.createdAt)}</p>
                  </div>
                </div>
                {viewPhoto.caption && (
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    {viewPhoto.caption}
                  </p>
                )}

                {/* Comments Section */}
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="text-xs font-bold text-imperial-gold-600 mb-2">
                    留言 {viewPhoto._count.comments > 0 && `(${viewPhoto._count.comments})`}
                  </p>

                  {commentsLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-lucky-red border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">還沒有留言，來說點什麼吧！</p>
                  ) : (
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                      {comments.map((c) => (
                        <div key={c.id} className="flex gap-2">
                          {c.user.pictureUrl ? (
                            <img
                              src={c.user.pictureUrl}
                              alt={c.user.displayName}
                              className="w-7 h-7 rounded-full border border-gray-200 object-cover shrink-0 mt-0.5"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full border border-gray-200 bg-gradient-to-br from-lucky-red to-lucky-red-700 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-white text-[10px] font-bold">
                                {c.user.displayName.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-bold text-cny-dark truncate">
                                {c.user.displayName}
                              </span>
                              <span className="text-[10px] text-gray-400 shrink-0">
                                {timeAgo(c.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 break-words leading-relaxed">
                              {c.text}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={commentsEndRef} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Comment Input - fixed at bottom */}
            <div className="shrink-0 border-t border-gray-100 p-3 flex gap-2">
              <input
                type="text"
                placeholder="留個言吧..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    handleSubmitComment()
                  }
                }}
                maxLength={500}
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-lucky-red-300 transition-colors"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submittingComment}
                className="shrink-0 w-9 h-9 rounded-full cny-gradient flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
              >
                {submittingComment ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
