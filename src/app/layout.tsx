import type { Metadata } from 'next'
import LineIABWarning from '@/components/LineIABWarning'
import './globals.css'

export const metadata: Metadata = {
  title: '新年限時活動 🧧',
  description: '團隊新年活動 - 每日任務、照片上傳、積分排行榜',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen">
        <LineIABWarning />
        {children}
      </body>
    </html>
  )
}
