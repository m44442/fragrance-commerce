// src/lib/next-auth/options.ts
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import LineProvider from 'next-auth/providers/line';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '../prisma';
import bcrypt from 'bcrypt';

export const nextAuthOptions: NextAuthOptions = {
    // 重要：secretを追加
    secret: process.env.NEXTAUTH_SECRET,
    
    debug: false, // 本番では false にする
    
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        }),
        LineProvider({
            clientId: process.env.LINE_CHANNEL_ID!,
            clientSecret: process.env.LINE_CHANNEL_SECRET!
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'メールアドレス', type: 'email' },
                password: { label: 'パスワード', type: 'password' }
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        return null;
                    }
                    
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email }
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
                        role: user.role
                    };
                } catch (error) {
                    console.error('Authorization error:', error);
                    return null;
                }
            }
        }),
    ],
    
    adapter: PrismaAdapter(prisma),
    
    pages: {
        signIn: '/login',
        signUp: '/signup',
        error: '/login',
    },
    
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    
    callbacks: {
        jwt: async ({ token, user }) => {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
        session: async ({ session, token }) => {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
        redirect: async ({ url, baseUrl }) => {
            if (url.startsWith('/login') || url.startsWith('/signup')) {
                return baseUrl;
            }
            if (url.startsWith('/')) {
                return `${baseUrl}${url}`;
            }
            if (new URL(url).origin === baseUrl) {
                return url;
            }
            return baseUrl;
        }
    }
};