import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // 自分のアカウントのみ変更可能
    if (session.user.id !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: '現在のパスワードと新しいパスワードを入力してください' },
        { status: 400 }
      );
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'パスワードは8文字以上で入力してください' },
        { status: 400 }
      );
    }
    
    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user || !user.password) {
      return NextResponse.json(
        { message: 'ユーザーが見つからないか、パスワードが設定されていません' },
        { status: 404 }
      );
    }
    
    // 現在のパスワードを確認
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { message: '現在のパスワードが正しくありません' },
        { status: 400 }
      );
    }
    
    // 新しいパスワードをハッシュ化
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // パスワードを更新
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
    
    return NextResponse.json(
      { message: 'パスワードを正常に変更しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}