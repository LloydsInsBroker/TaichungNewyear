import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { error, user } = await requireAuth()
  if (error) return error

  // Get top 50 users ordered by totalPoints DESC, then createdAt ASC
  const topUsers = await prisma.user.findMany({
    take: 50,
    orderBy: [
      { totalPoints: 'desc' },
      { createdAt: 'asc' },
    ],
    select: {
      id: true,
      displayName: true,
      pictureUrl: true,
      totalPoints: true,
    },
  })

  const leaderboard = topUsers.map((u, index) => ({
    rank: index + 1,
    displayName: u.displayName,
    pictureUrl: u.pictureUrl,
    totalPoints: u.totalPoints,
    isCurrentUser: u.id === user!.id,
  }))

  // Find current user's rank
  const currentUserInTop = leaderboard.find((u) => u.isCurrentUser)
  let myRank: number

  if (currentUserInTop) {
    myRank = currentUserInTop.rank
  } else {
    // Count users with more points, or same points but earlier creation
    const dbUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { totalPoints: true, createdAt: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const usersAhead = await prisma.user.count({
      where: {
        OR: [
          { totalPoints: { gt: dbUser.totalPoints } },
          {
            totalPoints: dbUser.totalPoints,
            createdAt: { lt: dbUser.createdAt },
          },
        ],
      },
    })

    myRank = usersAhead + 1
  }

  return NextResponse.json({ leaderboard, myRank })
}
