import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { token, email, newPassword } = await request.json();

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { message: '必要な情報が不足しています' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'パスワードは8文字以上で入力してください' },
        { status: 400 }
      );
    }

    // リセットトークンを検証
    const resetToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: `reset:${email}`,
          token: token,
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { message: '無効なリセットトークンです' },
        { status: 400 }
      );
    }

    // トークンの有効期限をチェック
    if (resetToken.expires < new Date()) {
      // 期限切れのトークンを削除
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: `reset:${email}`,
            token: token,
          },
        },
      });

      return NextResponse.json(
        { message: 'リセットトークンの有効期限が切れています' },
        { status: 400 }
      );
    }

    // ユーザーが存在するかチェック
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 新しいパスワードをハッシュ化
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // パスワードを更新
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // 使用済みトークンを削除
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: `reset:${email}`,
          token: token,
        },
      },
    });

    return NextResponse.json(
      { message: 'パスワードが正常にリセットされました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: 'パスワードリセットに失敗しました' },
      { status: 500 }
    );
  }
}