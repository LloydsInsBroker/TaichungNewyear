'use client'

import { signIn } from 'next-auth/react'

export default function LoginPage() {
  return (
    <div className="min-h-screen cny-gradient flex flex-col items-center justify-center px-6">
      {/* Decorative lanterns */}
      <div className="absolute top-0 left-8 text-6xl animate-lantern-swing origin-top">
        🏮
      </div>
      <div className="absolute top-0 right-8 text-6xl animate-lantern-swing origin-top" style={{ animationDelay: '1s' }}>
        🏮
      </div>

      {/* Main content */}
      <div className="text-center mb-12">
        <div className="text-8xl mb-4 animate-bounce-in">🧧</div>
        <h1 className="text-4xl font-black text-imperial-gold mb-2">
          新年快樂
        </h1>
        <p className="text-lucky-red-100 text-lg">
          團隊限時活動 2/14 ~ 2/22
        </p>
      </div>

      {/* Login card */}
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <h2 className="text-xl font-bold text-center text-cny-dark mb-6">
          登入參加活動
        </h2>
        <button
          onClick={() => signIn('line', { callbackUrl: '/tasks' })}
          className="w-full flex items-center justify-center gap-3 bg-[#06C755] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#05b34d] transition-colors duration-200"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          使用 LINE 登入
        </button>
        <p className="text-gray-400 text-xs text-center mt-4">
          登入即表示同意活動規則
        </p>
      </div>

      {/* Footer decorations */}
      <div className="mt-12 flex gap-4 text-4xl">
        <span className="animate-float">🎆</span>
        <span className="animate-float" style={{ animationDelay: '0.5s' }}>🎊</span>
        <span className="animate-float" style={{ animationDelay: '1s' }}>🎆</span>
      </div>
    </div>
  )
}
