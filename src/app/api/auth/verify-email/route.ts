import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { message: 'トークンとメールアドレスが必要です' },
        { status: 400 }
      );
    }

    // 認証トークンを検証
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: token,
        },
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { message: '無効な認証トークンです' },
        { status: 400 }
      );
    }

    // トークンの有効期限をチェック
    if (verificationToken.expires < new Date()) {
      // 期限切れのトークンを削除
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token: token,
          },
        },
      });

      return NextResponse.json(
        { message: '認証トークンの有効期限が切れています' },
        { status: 400 }
      );
    }

    // ユーザーのメール認証フラグを更新
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // 使用済みトークンを削除
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: token,
        },
      },
    });

    return NextResponse.json(
      { message: 'メールアドレスの認証が完了しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { message: 'メール認証に失敗しました' },
      { status: 500 }
    );
  }
}