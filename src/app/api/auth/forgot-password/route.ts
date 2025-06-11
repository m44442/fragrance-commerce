import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

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
      // セキュリティのため、ユーザーが存在しない場合でも成功レスポンスを返す
      return NextResponse.json(
        { message: 'パスワードリセット用のメールを送信しました（該当するアカウントがある場合）' },
        { status: 200 }
      );
    }

    // 既存のリセットトークンを削除
    await prisma.verificationToken.deleteMany({
      where: { 
        identifier: `reset:${email}`,
      },
    });

    // 新しいリセットトークンを生成
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1時間後

    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token,
        expires,
      },
    });

    // リセット用URLを生成
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // メール送信
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@fragrance.com',
      to: email,
      subject: '【香水ECサイト】パスワードリセットのご案内',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">パスワードリセット</h2>
          <p>こんにちは、${user.name}様</p>
          <p>パスワードリセットのリクエストを受け付けました。</p>
          <p>下記のリンクをクリックして、新しいパスワードを設定してください：</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              パスワードをリセット
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            このリンクは1時間で有効期限が切れます。<br>
            もしリンクが機能しない場合は、以下のURLを直接ブラウザにコピーしてください：<br>
            <span style="word-break: break-all;">${resetUrl}</span>
          </p>
          <p style="color: #666; font-size: 14px;">
            このリクエストに心当たりがない場合は、このメールを無視してください。
            パスワードは変更されません。
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'パスワードリセット用のメールを送信しました（該当するアカウントがある場合）' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset email error:', error);
    return NextResponse.json(
      { message: 'メール送信に失敗しました' },
      { status: 500 }
    );
  }
}