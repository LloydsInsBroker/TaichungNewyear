import { auth } from './auth'
import { prisma } from './prisma'
import { NextResponse } from 'next/server'

export async function getSessionUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user
}

export async function requireAuth() {
  const user = await getSessionUser()
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null }
  }
  return { error: null, user }
}

export async function requireAdmin() {
  const { error, user } = await requireAuth()
  if (error) return { error, user: null }
  if (user!.role !== 'ADMIN') {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      user: null,
    }
  }
  return { error: null, user }
}
