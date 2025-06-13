import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/next-auth/options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Admin check - Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user?.email) {
      console.log('Admin check - No session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者権限チェック
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        email: true,
        isAdmin: true,
        role: true 
      }
    });

    console.log('Admin check - DB User:', JSON.stringify(user, null, 2));

    if (!user?.isAdmin) {
      console.log('Admin check - User is not admin');
      return NextResponse.json({ 
        error: 'Admin access required',
        userFound: !!user,
        isAdmin: user?.isAdmin || false 
      }, { status: 403 });
    }

    console.log('Admin check - Success');
    return NextResponse.json({ 
      isAdmin: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Admin check failed:', error);
    return NextResponse.json(
      { error: 'Admin check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
