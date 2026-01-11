import { Role, AccountStatus } from '@prisma/client'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
    username: string
    role: Role
    status: AccountStatus
    avatar?: string | null
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      username: string
      role: Role
      status: AccountStatus
      avatar?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: Role
    status: AccountStatus
  }
}

