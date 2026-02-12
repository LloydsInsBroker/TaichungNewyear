import type { NextAuthConfig } from 'next-auth'

// LINE Login provider
const lineProvider = {
  id: 'line',
  name: 'LINE',
  type: 'oauth' as const,
  authorization: {
    url: 'https://access.line.me/oauth2/v2.1/authorize',
    params: { scope: 'profile' },
  },
  token: {
    url: 'https://api.line.me/oauth2/v2.1/token',
  },
  userinfo: {
    url: 'https://api.line.me/v2/profile',
  },
  clientId: process.env.AUTH_LINE_ID,
  clientSecret: process.env.AUTH_LINE_SECRET,
  checks: ['state'] as ('state' | 'pkce' | 'none')[],
  profile(profile: { userId: string; displayName: string; pictureUrl?: string }) {
    return {
      id: profile.userId,
      name: profile.displayName,
      image: profile.pictureUrl,
    }
  },
}

// Edge-safe config (no Prisma) — used by middleware
export const authConfig: NextAuthConfig = {
  providers: [lineProvider],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.lineUserId = user.id
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      // Only attach JWT data here (no DB calls)
      if (token.lineUserId) {
        session.user.lineUserId = token.lineUserId as string
      }
      return session
    },
  },
}
