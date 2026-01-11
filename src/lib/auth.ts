import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import type { Adapter } from 'next-auth/adapters'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
    verifyRequest: '/verify-email',
  },
  
  providers: [
    // Google OAuth - Only add if credentials are properly configured
    ...(process.env.GOOGLE_CLIENT_ID && 
        process.env.GOOGLE_CLIENT_ID !== '' && 
        process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id' &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_CLIENT_SECRET !== '' &&
        process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret'
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          profile(profile) {
            return {
              id: profile.sub,
              email: profile.email,
              name: profile.name,
              username: profile.email.split('@')[0] + '_' + Math.random().toString(36).slice(2, 6),
              avatar: profile.picture,
              emailVerified: profile.email_verified ? new Date() : null,
              role: 'USER' as const,
              status: 'ACTIVE' as const,
            }
          },
        })]
      : []
    ),
    
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          throw new Error('Invalid email or password')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Invalid email or password')
        }

        if (user.status === 'BANNED') {
          throw new Error('Your account has been banned')
        }

        if (user.status === 'SUSPENDED') {
          throw new Error('Your account has been suspended')
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          role: user.role,
          status: user.status,
        }
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.username = (user as any).username
        token.role = (user as any).role
        token.status = (user as any).status
      }

      // Update session
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }

      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as any
        session.user.status = token.status as any
      }
      return session
    },
    
    async signIn({ user, account }) {
      // OAuth sign in
      if (account?.provider !== 'credentials') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        })

        // Create user if doesn't exist
        if (!existingUser) {
          const username = user.email!.split('@')[0] + Math.random().toString(36).slice(-4)
          await prisma.user.create({
            data: {
              email: user.email!,
              username,
              name: user.name,
              avatar: user.image,
              emailVerified: new Date(),
              status: 'ACTIVE',
              role: 'USER',
            },
          })
        } else if (existingUser.status === 'BANNED') {
          return false
        }
      }

      return true
    },
  },
  
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        // Send welcome email, etc.
        console.log('New user signed up:', user.email)
      }
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
}

