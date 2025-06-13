import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing database connection...');
    console.log('Prisma client:', !!prisma);
    console.log('Prisma type:', typeof prisma);
    
    if (!prisma) {
      throw new Error('Prisma client is not initialized');
    }
    
    // 基本的な接続テスト
    console.log('Testing basic connection...');
    await prisma.$connect();
    
    // データベース接続テスト
    console.log('Counting users...');
    const userCount = await prisma.user.count();
    
    console.log('Counting products...');
    const productCount = await prisma.product.count();
    
    console.log('Counting brands...');
    const brandCount = await prisma.brand.count();
    
    console.log('Database counts:', { userCount, productCount, brandCount });
    
    // サンプル商品を取得
    console.log('Getting sample product...');
    const sampleProduct = await prisma.product.findFirst({
      include: {
        brand: true
      }
    });
    
    console.log('Sample product:', sampleProduct);
    
    return NextResponse.json({
      success: true,
      counts: {
        users: userCount,
        products: productCount,
        brands: brandCount
      },
      sampleProduct: sampleProduct,
      message: 'Database connection successful'
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error code:', error && typeof error === 'object' && 'code' in error ? error.code : 'Unknown');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorCode: error && typeof error === 'object' && 'code' in error ? error.code : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 });
  }
}