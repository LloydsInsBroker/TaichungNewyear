'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface ScratchCardProps {
  day: number
  hasCard: boolean
  isScratched: boolean
  isWinner?: boolean
  prizeName?: string | null
  onScratch: () => Promise<{ isWinner: boolean; prizeName: string | null }>
}

export default function ScratchCard({
  day,
  hasCard,
  isScratched: initialIsScratched,
  isWinner: initialIsWinner,
  prizeName: initialPrizeName,
  onScratch,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isScratched, setIsScratched] = useState(initialIsScratched)
  const [isWinner, setIsWinner] = useState(initialIsWinner)
  const [prizeName, setPrizeName] = useState(initialPrizeName)
  const [isRevealing, setIsRevealing] = useState(false)
  const [revealed, setRevealed] = useState(initialIsScratched)
  const isDrawingRef = useRef(false)
  const hasCalledApiRef = useRef(false)

  const revealResult = useCallback(async () => {
    if (hasCalledApiRef.current) return
    hasCalledApiRef.current = true
    setIsRevealing(true)

    try {
      const result = await onScratch()
      setIsWinner(result.isWinner)
      setPrizeName(result.prizeName)
      setIsScratched(true)
    } catch {
      hasCalledApiRef.current = false
      setIsRevealing(false)
      return
    }

    // Fade out canvas
    const canvas = canvasRef.current
    if (canvas) {
      canvas.style.transition = 'opacity 0.5s ease-out'
      canvas.style.opacity = '0'
    }
    setTimeout(() => setRevealed(true), 500)
  }, [onScratch])

  useEffect(() => {
    if (isScratched || !hasCard) return

    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)

    // Gold gradient background
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height)
    gradient.addColorStop(0, '#cfb53b')
    gradient.addColorStop(0.3, '#e8d374')
    gradient.addColorStop(0.5, '#f5e6a3')
    gradient.addColorStop(0.7, '#e8d374')
    gradient.addColorStop(1, '#cfb53b')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Shimmer pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * rect.width
      const y = Math.random() * rect.height
      ctx.beginPath()
      ctx.arc(x, y, Math.random() * 3 + 1, 0, Math.PI * 2)
      ctx.fill()
    }

    // Text
    ctx.fillStyle = '#8b6914'
    ctx.font = `bold ${Math.min(rect.width * 0.08, 24)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('刮刮看!', rect.width / 2, rect.height / 2)

    // Scratch logic
    const totalPixels = rect.width * rect.height

    function getPos(e: MouseEvent | Touch) {
      const cr = canvas!.getBoundingClientRect()
      return { x: e.clientX - cr.left, y: e.clientY - cr.top }
    }

    function scratch(x: number, y: number) {
      ctx!.globalCompositeOperation = 'destination-out'
      ctx!.beginPath()
      ctx!.arc(x, y, 20, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.globalCompositeOperation = 'source-over'
      checkProgress()
    }

    function checkProgress() {
      if (hasCalledApiRef.current) return
      const imageData = ctx!.getImageData(0, 0, canvas!.width, canvas!.height)
      let transparent = 0
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] === 0) transparent++
      }
      const dpr = window.devicePixelRatio || 1
      const ratio = transparent / (totalPixels * dpr * dpr)
      if (ratio > 0.4) {
        revealResult()
      }
    }

    function onMouseDown(e: MouseEvent) {
      isDrawingRef.current = true
      const pos = getPos(e)
      scratch(pos.x, pos.y)
    }
    function onMouseMove(e: MouseEvent) {
      if (!isDrawingRef.current) return
      const pos = getPos(e)
      scratch(pos.x, pos.y)
    }
    function onMouseUp() {
      isDrawingRef.current = false
    }
    function onTouchStart(e: TouchEvent) {
      e.preventDefault()
      isDrawingRef.current = true
      const pos = getPos(e.touches[0])
      scratch(pos.x, pos.y)
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      if (!isDrawingRef.current) return
      const pos = getPos(e.touches[0])
      scratch(pos.x, pos.y)
    }
    function onTouchEnd() {
      isDrawingRef.current = false
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mouseleave', onMouseUp)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('mouseleave', onMouseUp)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [isScratched, hasCard, revealResult])

  if (!hasCard) return null

  return (
    <div className="mt-4">
      <div className="text-center mb-2">
        <span className="text-sm font-bold text-amber-600">限時加碼刮刮樂</span>
      </div>
      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden border-2 border-amber-300 shadow-lg"
        style={{ height: 180 }}
      >
        {/* Result layer (underneath) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-amber-50">
          {(revealed || isScratched) ? (
            isWinner ? (
              <div className="text-center animate-bounce-in">
                <div className="text-4xl mb-2">🧧</div>
                <p className="text-lg font-bold text-red-600">恭喜中獎！</p>
                <p className="text-xl font-bold text-amber-600 mt-1">{prizeName}</p>
                <p className="text-xs text-gray-500 mt-2">請聯繫管理員領取獎品</p>
              </div>
            ) : (
              <div className="text-center animate-bounce-in">
                <div className="text-4xl mb-2">💫</div>
                <p className="text-lg font-bold text-gray-600">差一點點！</p>
                <p className="text-sm text-gray-500 mt-1">感謝參與，下次好運！</p>
              </div>
            )
          ) : (
            <div className="text-center text-gray-300">
              <p className="text-sm">刮開覆蓋層揭曉結果</p>
            </div>
          )}
        </div>

        {/* Canvas scratch layer (on top) */}
        {!revealed && !isScratched && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-pointer"
            style={{ touchAction: 'none' }}
          />
        )}
      </div>

      {/* Fallback reveal button */}
      {!revealed && !isScratched && (
        <button
          onClick={() => revealResult()}
          disabled={isRevealing}
          className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 underline disabled:opacity-50"
        >
          {isRevealing ? '揭曉中...' : '直接揭曉'}
        </button>
      )}
    </div>
  )
}
