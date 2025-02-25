import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import LineProvider from 'next-auth/providers/line';
import prisma from '../prisma';


export const nextAuthOptions: NextAuthOptions = {
    debug: false,
    providers: [
        LineProvider({
            clientId: process.env.LINE_CHANNEL_ID!,
            clientSecret: process.env.LINE_CHANNEL_SECRET!
        }),
    ],
    adapter: PrismaAdapter(prisma),
    callbacks: {
        async session({ session, token, user }) {
          session.user = user;
          return session;
        },
      },
};