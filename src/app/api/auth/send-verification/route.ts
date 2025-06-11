import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

// メール送信設定
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    // ユーザーが存在するかチェック
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'このメールアドレスのユーザーは存在しません' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'このメールアドレスは既に認証済みです' },
        { status: 400 }
      );
    }

    // 既存の認証トークンを削除
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // 新しい認証トークンを生成
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // 認証用URLを生成
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    // メール送信
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@fragrance.com',
      to: email,
      subject: '【香水ECサイト】メールアドレス認証のお願い',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">メールアドレス認証</h2>
          <p>こんにちは、${user.name}様</p>
          <p>香水ECサイトにご登録いただき、ありがとうございます。</p>
          <p>下記のリンクをクリックして、メールアドレスの認証を完了してください：</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              メールアドレスを認証する
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            このリンクは24時間で有効期限が切れます。<br>
            もし認証リンクが機能しない場合は、以下のURLを直接ブラウザにコピーしてください：<br>
            <span style="word-break: break-all;">${verificationUrl}</span>
          </p>
          <p style="color: #666; font-size: 14px;">
            このメールに心当たりがない場合は、このメールを無視してください。
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: '認証メールを送信しました。メールボックスをご確認ください。' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verification email error:', error);
    return NextResponse.json(
      { message: 'メール送信に失敗しました' },
      { status: 500 }
    );
  }
}