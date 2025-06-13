import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envVars = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_POOLED: !!process.env.DATABASE_URL_POOLED,
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    };

    console.log('Environment variables:', envVars);
    console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);

    return NextResponse.json({
      success: true,
      env: envVars,
      message: 'Environment variables checked'
    });
    
  } catch (error) {
    console.error('Environment test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}