// src/app/api/debug/create-test-purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('=== Creating test purchase ===');
    
    // 最初の商品を取得
    const firstProduct = await prisma.product.findFirst({
      where: {
        isPublished: true
      }
    });
    
    if (!firstProduct) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 });
    }
    
    console.log('Using product:', firstProduct.id, firstProduct.name);
    
    // テスト購入履歴を作成
    const purchase = await prisma.purchase.create({
      data: {
        userId: session.user.id,
        fragranceId: firstProduct.id,
      },
    });
    
    console.log('Test purchase created:', {
      id: purchase.id,
      userId: purchase.userId,
      fragranceId: purchase.fragranceId,
      createdAt: purchase.createdAt
    });
    
    return NextResponse.json({ 
      success: true,
      purchase: {
        id: purchase.id,
        userId: purchase.userId,
        fragranceId: purchase.fragranceId,
        productName: firstProduct.name,
        createdAt: purchase.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error creating test purchase:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}