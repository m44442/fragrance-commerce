// src/app/api/debug/check-db/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Database Check ===');
    
    // 商品数をカウント
    const productCount = await prisma.product.count();
    console.log('Total products:', productCount);
    
    // 最初の5つの商品を取得
    const products = await prisma.product.findMany({
      take: 5,
      include: {
        brand: true
      }
    });
    
    // ユーザー数をカウント
    const userCount = await prisma.user.count();
    console.log('Total users:', userCount);
    
    // 購入履歴数をカウント  
    const purchaseCount = await prisma.purchase.count();
    console.log('Total purchases:', purchaseCount);
    
    return NextResponse.json({ 
      success: true,
      stats: {
        productCount,
        userCount,
        purchaseCount
      },
      sampleProducts: products.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand?.name,
        price: p.price,
        isPublished: p.isPublished
      }))
    });
    
  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json({ 
      error: 'Database error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}