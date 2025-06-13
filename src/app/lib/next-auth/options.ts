// src/lib/next-auth/options.ts
import { NextAuthOptions } from "next-auth";
import LineProvider from "next-auth/providers/line";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  // 重要：secretを追加
  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development', // 開発環境でのみデバッグ

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    LineProvider({
      clientId: process.env.LINE_CHANNEL_ID!,
      clientSecret: process.env.LINE_CHANNEL_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isAdmin: user.isAdmin,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],

  // PrismaAdapterを削除（JWTとの競合を避けるため）
  // adapter: PrismaAdapter(prisma),

  pages: {
    signIn: "/login",
    signUp: "/signup",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    jwt: async ({ token, user }) => {
      // ユーザーがログインした場合
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as any).role;
        token.isAdmin = (user as any).isAdmin;
      } else if (token.email && !token.id) {
        // セッション継続時にIDが不足している場合、メールからIDを取得
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { id: true, isAdmin: true, role: true }
          });
          
          if (dbUser) {
            token.id = dbUser.id;
            token.isAdmin = dbUser.isAdmin;
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error('JWT callback error:', error);
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        (session.user as any).isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
    redirect: async ({ url, baseUrl }) => {
      if (url.startsWith("/login") || url.startsWith("/signup")) {
        return baseUrl;
      }
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
};
