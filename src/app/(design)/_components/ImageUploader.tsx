'use client'

import { useRef, useState } from 'react'

export interface UploadedRef {
  gcsKey: string
  previewUrl: string
  status: 'uploading' | 'done' | 'error'
  errorMessage?: string
}

interface Props {
  value: UploadedRef[]
  onChange: (next: UploadedRef[]) => void
  maxCount?: number
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export default function ImageUploader({ value, onChange, maxCount = 8 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const uploadOne = async (file: File): Promise<UploadedRef> => {
    const previewUrl = URL.createObjectURL(file)
    const placeholder: UploadedRef = { gcsKey: '', previewUrl, status: 'uploading' }
    // Show placeholder immediately
    onChange([...value, placeholder])

    try {
      if (!ALLOWED.includes(file.type)) {
        throw new Error('檔案格式需為 JPEG / PNG / WebP')
      }
      if (file.size > MAX_BYTES) {
        throw new Error('檔案大小不可超過 10 MB')
      }

      // 1. Request signed URL
      const urlRes = await fetch('/api/design/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      if (!urlRes.ok) {
        const data = await urlRes.json().catch(() => ({}))
        throw new Error(data.error || '無法取得上傳網址')
      }
      const { uploadUrl, gcsKey } = await urlRes.json()

      // 2. PUT to GCS
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!putRes.ok) throw new Error('上傳到雲端失敗')

      return { gcsKey, previewUrl, status: 'done' }
    } catch (err: any) {
      return {
        gcsKey: '',
        previewUrl,
        status: 'error',
        errorMessage: err?.message || '上傳失敗',
      }
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const room = maxCount - value.length
    if (room <= 0) return
    const slice = Array.from(files).slice(0, room)

    // Upload sequentially so the placeholder state remains consistent
    let current = [...value]
    for (const file of slice) {
      const placeholder: UploadedRef = {
        gcsKey: '',
        previewUrl: URL.createObjectURL(file),
        status: 'uploading',
      }
      current = [...current, placeholder]
      onChange(current)
      const idx = current.length - 1

      const result = await uploadOne(file).catch(
        (err): UploadedRef => ({
          gcsKey: '',
          previewUrl: placeholder.previewUrl,
          status: 'error',
          errorMessage: err?.message,
        }),
      )
      // Replace placeholder with result
      current = current.map((r, i) => (i === idx ? result : r))
      onChange(current)
    }
  }

  const removeAt = (idx: number) => {
    const next = value.filter((_, i) => i !== idx)
    onChange(next)
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={[
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          dragging
            ? 'border-stone-900 bg-stone-100'
            : 'border-stone-300 bg-white hover:border-stone-500',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <p className="text-sm text-stone-600">
          點擊或拖拉檔案到此上傳參考圖
        </p>
        <p className="text-xs text-stone-400 mt-1">
          支援 JPEG / PNG / WebP，每張 10 MB 內，最多 {maxCount} 張
        </p>
      </div>

      {value.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((r, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-md overflow-hidden border border-stone-200 bg-stone-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.previewUrl}
                alt={`參考圖 ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {r.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {r.status === 'error' && (
                <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center px-2">
                  <span className="text-white text-xs text-center">
                    {r.errorMessage || '失敗'}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeAt(i)
                }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-stone-700 text-xs shadow"
                aria-label="移除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
