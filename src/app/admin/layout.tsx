import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SessionProvider from '@/components/providers/SessionProvider'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/tasks')
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">管理後台</h1>
            <Link
              href="/tasks"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              返回活動
            </Link>
          </div>
          <nav className="max-w-5xl mx-auto px-4 pb-2 flex gap-4">
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
              總覽
            </Link>
            <Link href="/admin/tasks" className="text-sm text-gray-600 hover:text-gray-900">
              任務管理
            </Link>
            <Link href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900">
              用戶管理
            </Link>
            <Link href="/admin/lottery" className="text-sm text-gray-600 hover:text-gray-900">
              抽獎管理
            </Link>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}
