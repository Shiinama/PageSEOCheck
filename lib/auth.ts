import { DrizzleAdapter } from '@auth/drizzle-adapter'
import NextAuth from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'
import Google from 'next-auth/providers/google'
import TwitterProvider from 'next-auth/providers/twitter'

import { createDb } from '@/lib/db'

import { accounts, sessions, users, verificationTokens } from './db/schema'

export const { handlers, signIn, signOut, auth } = NextAuth(() => {
  const db = createDb()

  return {
    secret: process.env.AUTH_SECRET,
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens
    }),
    providers: [
      Google,
      TwitterProvider({
        clientId: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET
      }),
      DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET
      })
    ],
    session: {
      strategy: 'jwt'
    },
    callbacks: {
      jwt: async ({ token, user }) => {
        if (user) {
          token.id = user.id
        }
        return token
      },
      session: async ({ session, token }) => {
        if (token && session.user) {
          session.user.id = token.id as string
        }
        return session
      }
    }
  }
})
