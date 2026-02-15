import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SessionProvider from '@/components/providers/SessionProvider'
import BottomNav from '@/components/layout/BottomNav'
import Header from '@/components/layout/Header'

export default async function AuthenticatedLayout({
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
      <div className="min-h-screen pb-20">
        <Header totalPoints={session.user.totalPoints} />
        <main className="px-4 py-4 max-w-lg mx-auto">
          {children}
        </main>
        <BottomNav />
      </div>
    </SessionProvider>
  )
}
