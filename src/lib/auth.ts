import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { prisma } from './prisma'
import { addPoints } from './points'
import { PointType } from '@prisma/client'

// Early login bonus deadline: 2026/2/13 12:00 UTC+8
const EARLY_LOGIN_DEADLINE = new Date('2026-02-13T04:00:00Z') // 12:00 UTC+8 = 04:00 UTC
const EARLY_LOGIN_POINTS = 3

// Full config with Prisma callbacks — used by API routes & server components (Node.js runtime)
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (!user.id) return false

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { lineUserId: user.id },
      })

      if (existingUser) {
        // Existing user — just update profile
        await prisma.user.update({
          where: { lineUserId: user.id },
          data: {
            displayName: user.name || 'LINE User',
            pictureUrl: user.image || null,
          },
        })
      } else {
        // New user — create account
        const newUser = await prisma.user.create({
          data: {
            lineUserId: user.id,
            displayName: user.name || 'LINE User',
            pictureUrl: user.image || null,
          },
        })

        // Award early login bonus if before deadline
        if (new Date() < EARLY_LOGIN_DEADLINE) {
          await addPoints(
            newUser.id,
            EARLY_LOGIN_POINTS,
            PointType.EARLY_LOGIN,
            newUser.id,
            '搶先登入獎勵',
          )
        }
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.lineUserId = user.id
        token.name = user.name
        token.picture = user.image
      }
      // Always fetch latest role & points from DB
      if (token.lineUserId) {
        const dbUser = await prisma.user.findUnique({
          where: { lineUserId: token.lineUserId as string },
        })
        if (dbUser) {
          token.dbId = dbUser.id
          token.role = dbUser.role
          token.totalPoints = dbUser.totalPoints
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token.lineUserId) {
        session.user.lineUserId = token.lineUserId as string
        session.user.id = (token.dbId as string) || ''
        session.user.role = (token.role as 'USER' | 'ADMIN') || 'USER'
        session.user.totalPoints = (token.totalPoints as number) || 0
      }
      return session
    },
  },
})
