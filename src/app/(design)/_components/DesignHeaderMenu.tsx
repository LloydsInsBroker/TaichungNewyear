'use client'

import { signOut } from 'next-auth/react'

export default function DesignHeaderMenu() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-xs text-stone-500 hover:text-stone-900 underline-offset-2 hover:underline"
    >
      登出
    </button>
  )
}
