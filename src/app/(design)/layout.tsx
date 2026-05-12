import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import SessionProvider from '@/components/providers/SessionProvider'
import DesignHeaderMenu from './_components/DesignHeaderMenu'

export default async function DesignLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session || !session.user?.id) {
    redirect('/api/auth/signout')
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-stone-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <Link href="/design" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-stone-800 to-stone-600 flex items-center justify-center text-white text-sm font-bold">
                AI
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight">居家設計提案</h1>
                <p className="text-xs text-stone-500 -mt-0.5">AI Concept Board Generator</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/design/history"
                className="text-sm text-stone-700 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-100"
              >
                我的記錄
              </Link>
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'avatar'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="hidden sm:block text-sm text-stone-700 max-w-[140px] truncate">
                {session.user.name || 'LINE 使用者'}
              </span>
              <DesignHeaderMenu />
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6 md:py-10">{children}</main>
        <footer className="max-w-5xl mx-auto px-4 py-8 text-center text-xs text-stone-400">
          由 OpenAI gpt-image-2 生成 · 圖像僅供設計概念參考
        </footer>
      </div>
    </SessionProvider>
  )
}
