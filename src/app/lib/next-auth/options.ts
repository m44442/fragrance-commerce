// src/lib/next-auth/options.ts
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import LineProvider from 'next-auth/providers/line';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '../prisma';
import bcrypt from 'bcrypt';

export const nextAuthOptions: NextAuthOptions = {
    debug: false,
    providers: [
        LineProvider({
            clientId: process.env.LINE_CHANNEL_ID || '',
            clientSecret: process.env.LINE_CHANNEL_SECRET || ''
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'メールアドレス', type: 'email' },
                password: { label: 'パスワード', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }
                
                // ユーザーの検索
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });
                
                if (!user || !user.password) {
                    return null;
                }
                
                // パスワードの検証
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
                    role: user.role
                };
            }
        }),
    ],
    
    adapter: PrismaAdapter(prisma),
    pages: {
        signIn: '/login', // デフォルトのサインインページ
        error: '/login', // エラー時のリダイレクト先
    },
    session: {
        strategy: "jwt", // JWT を使用していることを確認
        maxAge: 30 * 24 * 60 * 60, // 30日間
    },
    callbacks: {
        // JWT コールバックでユーザー ID を含めていることを確認
        jwt: async ({ token, user }) => {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
        // セッションコールバックで JWT からユーザー ID を転送
        session: async ({ session, token }) => {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        }
    }
};