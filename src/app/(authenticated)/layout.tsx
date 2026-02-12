import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SessionProvider from '@/components/providers/SessionProvider'
import BottomNav from '@/components/layout/BottomNav'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <SessionProvider>
      <div className="min-h-screen pb-20">
        <header className="cny-gradient text-white py-3 px-4 flex items-center justify-between sticky top-0 z-40">
          <Link href="/" className="text-sm font-bold hover:text-imperial-gold-200 transition-colors">🧧 諾億台中 2026 新年限定活動</Link>
          <div className="flex items-center gap-2">
            <span className="text-imperial-gold-200 text-sm font-medium">
              {session.user.totalPoints} 分
            </span>
          </div>
        </header>
        <main className="px-4 py-4 max-w-lg mx-auto">
          {children}
        </main>
        <BottomNav />
      </div>
    </SessionProvider>
  )
}
