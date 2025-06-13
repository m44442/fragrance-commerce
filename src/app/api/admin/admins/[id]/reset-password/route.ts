import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/next-auth/options';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// 管理者パスワードリセット
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 });
    }

    // 対象ユーザーを取得
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { email: true, isAdmin: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!targetUser.isAdmin) {
      return NextResponse.json({ error: 'User is not an admin' }, { status: 400 });
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // パスワードを更新
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword
      }
    });

    console.log(`Password reset for admin: ${targetUser.email} by ${session.user.email}`);

    return NextResponse.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Failed to reset password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}