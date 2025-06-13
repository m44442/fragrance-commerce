// src/app/api/like/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    console.log("いいねAPI POST - 商品ID:", productId);
    
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    console.log("セッション情報:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    if (!session?.user?.id) {
      console.log("認証エラー: セッションまたはユーザーIDが見つかりません");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // MicroCMS IDから内部Product IDを取得
    let product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: productId },
          { microCmsId: productId }
        ]
      }
    });
    
    if (!product) {
      console.log("Product not found for ID:", productId);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    const internalProductId = product.id;
    console.log("Product ID mapping:", { input: productId, internal: internalProductId });

    const { liked } = await request.json();
    console.log("いいね操作:", { liked, userId: session.user.id, productId, internalProductId });
    
    if (liked) {
      // お気に入りに追加
      try {
        const result = await prisma.favorite.create({
          data: {
            userId: session.user.id,
            productId: internalProductId, // 内部Product IDを使用
          },
        });
        console.log("お気に入り追加成功:", result);
      } catch (error: any) {
        // すでに存在する場合はエラーを無視
        console.log('お気に入り追加エラー (既に存在の可能性):', error.message);
        
        // 既に存在する場合のエラーコードをチェック
        if (error.code === 'P2002') {
          console.log("すでにお気に入りに追加済み");
        }
      }
    } else {
      // お気に入りから削除
      const deleteResult = await prisma.favorite.deleteMany({
        where: {
          userId: session.user.id,
          productId: internalProductId, // 内部Product IDを使用
        },
      });
      console.log("お気に入り削除結果:", deleteResult);
    }
    
    console.log("いいね操作完了 - 結果:", { success: true, liked });
    return NextResponse.json({ success: true, liked });
  } catch (error) {
    console.error('Error updating favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    console.log("いいねAPI GET - 商品ID:", productId);
    
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    console.log("GETセッション情報:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    if (!session?.user?.id) {
      console.log("GET認証エラー: セッションまたはユーザーIDが見つかりません");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // MicroCMS IDから内部Product IDを取得
    let product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: productId },
          { microCmsId: productId }
        ]
      }
    });
    
    if (!product) {
      console.log("GET Product not found for ID:", productId);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    const internalProductId = product.id;
    console.log("GET Product ID mapping:", { input: productId, internal: internalProductId });
    
    // お気に入り状態を確認
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        productId: internalProductId, // 内部Product IDを使用
      },
    });
    
    console.log("お気に入り状態チェック結果:", {
      userId: session.user.id,
      productId,
      favorite: !!favorite,
      favoriteData: favorite
    });
    
    return NextResponse.json({ liked: !!favorite });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // MicroCMS IDから内部Product IDを取得
    let product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: productId },
          { microCmsId: productId }
        ]
      }
    });
    
    if (!product) {
      console.log("DELETE Product not found for ID:", productId);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    const internalProductId = product.id;
    console.log("DELETE Product ID mapping:", { input: productId, internal: internalProductId });
    
    // お気に入りから削除
    await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        productId: internalProductId, // 内部Product IDを使用
      },
    });
    
    return NextResponse.json({ success: true, liked: false });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}