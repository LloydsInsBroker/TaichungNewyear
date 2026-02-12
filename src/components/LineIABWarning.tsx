'use client'

import { useEffect, useState } from 'react'

export default function LineIABWarning() {
  const [isLineIAB, setIsLineIAB] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    // LINE in-app browser includes "Line/" in user agent
    if (/Line\//i.test(ua)) {
      setIsLineIAB(true)
    }
  }, [])

  if (!isLineIAB || dismissed) return null

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const browserName = isIOS ? 'Safari' : 'Chrome'

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
        <div className="text-5xl mb-4">🌐</div>
        <h2 className="text-lg font-bold text-cny-dark mb-3">
          建議使用外部瀏覽器開啟
        </h2>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          您目前在 LINE 的內建瀏覽器中，為了更好的體驗，請用 {browserName} 開啟此頁面。
        </p>

        {/* Step-by-step instructions */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left">
          <p className="text-sm font-semibold text-cny-dark mb-2">操作步驟：</p>
          <ol className="text-sm text-gray-600 space-y-2">
            <li className="flex gap-2">
              <span className="font-bold text-lucky-red shrink-0">1.</span>
              <span>點擊右下角「<strong>⋯</strong>」選單按鈕</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-lucky-red shrink-0">2.</span>
              <span>選擇「<strong>在{browserName}中開啟</strong>」</span>
            </li>
          </ol>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
        >
          我知道了，繼續使用
        </button>
      </div>
    </div>
  )
}
