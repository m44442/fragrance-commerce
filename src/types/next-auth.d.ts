import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      isAdmin?: boolean
    }
  }

  interface User {
    id: string
    email?: string | null
    name?: string | null
    role?: string
    isAdmin?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: string
    isAdmin?: boolean
  }
}