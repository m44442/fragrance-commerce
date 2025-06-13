import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/next-auth/options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // スーパー管理者（初期管理者）かチェック
    if (session.user.email !== 'rikumatsumoto.2003@gmail.com') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // データベースでも確認
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, role: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    return NextResponse.json({ 
      isSuperAdmin: true,
      email: session.user.email 
    });

  } catch (error) {
    console.error('Super admin check failed:', error);
    return NextResponse.json(
      { error: 'Super admin check failed' },
      { status: 500 }
    );
  }
}