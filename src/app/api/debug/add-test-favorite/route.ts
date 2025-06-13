// src/app/api/debug/add-test-favorite/route.ts
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
    
    console.log('=== Creating test favorite ===');
    
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
    
    // 既存のお気に入りがあるかチェック
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: firstProduct.id
        }
      }
    });
    
    if (existingFavorite) {
      return NextResponse.json({ 
        success: true,
        message: 'Favorite already exists',
        favorite: existingFavorite
      });
    }
    
    // テストお気に入りを作成
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        productId: firstProduct.id,
      },
    });
    
    console.log('Test favorite created:', {
      id: favorite.id,
      userId: favorite.userId,
      productId: favorite.productId,
      createdAt: favorite.createdAt
    });
    
    return NextResponse.json({ 
      success: true,
      favorite: {
        id: favorite.id,
        userId: favorite.userId,
        productId: favorite.productId,
        productName: firstProduct.name,
        createdAt: favorite.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error creating test favorite:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}