// src/app/api/like/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { liked } = await request.json();
    
    if (liked) {
      // お気に入りに追加
      try {
        await prisma.favorite.create({
          data: {
            userId: session.user.id,
            productId: params.productId,
          },
        });
      } catch (error) {
        // すでに存在する場合はエラーを無視
        console.error('Error adding favorite:', error);
      }
    } else {
      // お気に入りから削除
      await prisma.favorite.deleteMany({
        where: {
          userId: session.user.id,
          productId: params.productId,
        },
      });
    }
    
    return NextResponse.json({ success: true, liked });
  } catch (error) {
    console.error('Error updating favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // お気に入り状態を確認
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        productId: params.productId,
      },
    });
    
    return NextResponse.json({ liked: !!favorite });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}