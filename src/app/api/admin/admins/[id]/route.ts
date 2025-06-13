import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/next-auth/options';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 管理者削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // スーパー管理者かチェック
    if (session.user.email !== 'rikumatsumoto.2003@gmail.com') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { id } = await params;

    // 削除対象のユーザーを取得
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { email: true, isAdmin: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 初期管理者は削除不可
    if (targetUser.email === 'rikumatsumoto.2003@gmail.com') {
      return NextResponse.json({ error: 'Cannot delete super admin' }, { status: 403 });
    }

    if (!targetUser.isAdmin) {
      return NextResponse.json({ error: 'User is not an admin' }, { status: 400 });
    }

    // 管理者権限を削除（ユーザー自体は削除しない、安全のため）
    await prisma.user.update({
      where: { id },
      data: {
        isAdmin: false,
        role: 'USER'
      }
    });

    console.log(`Admin access removed from: ${targetUser.email} by ${session.user.email}`);

    return NextResponse.json({ message: 'Admin access removed successfully' });

  } catch (error) {
    console.error('Failed to remove admin:', error);
    return NextResponse.json(
      { error: 'Failed to remove admin' },
      { status: 500 }
    );
  }
}