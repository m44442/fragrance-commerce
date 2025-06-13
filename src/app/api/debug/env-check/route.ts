// src/app/api/debug/env-check/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envCheck = {
      NEXT_PUBLIC_SERVICE_DOMAIN: process.env.NEXT_PUBLIC_SERVICE_DOMAIN ? '✅ Set' : '❌ Missing',
      NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY ? '✅ Set' : '❌ Missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✅ Set' : '❌ Missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing',
      DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
      NODE_ENV: process.env.NODE_ENV || 'undefined',
      // 実際の値は表示しない（セキュリティのため）
      values: {
        NEXT_PUBLIC_SERVICE_DOMAIN: process.env.NEXT_PUBLIC_SERVICE_DOMAIN?.substring(0, 5) + '...',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    };

    return NextResponse.json(envCheck);
  } catch (error) {
    console.error('Environment check error:', error);
    return NextResponse.json({ error: 'Environment check failed' }, { status: 500 });
  }
}