import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/next-auth/options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Session data:', JSON.stringify(session, null, 2));
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'No session found',
        session: session,
        hasSession: !!session,
        hasUser: !!session?.user,
        hasEmail: !!session?.user?.email,
        hasId: !!session?.user?.id
      });
    }

    // データベースからユーザー情報を取得
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        role: true,
        createdAt: true
      }
    });

    console.log('Database user:', JSON.stringify(dbUser, null, 2));

    return NextResponse.json({
      session: session,
      dbUser: dbUser,
      isAdmin: dbUser?.isAdmin || false,
      role: dbUser?.role || 'USER'
    });

  } catch (error) {
    console.error('Debug user error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error },
      { status: 500 }
    );
  }
}