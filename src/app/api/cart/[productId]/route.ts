// src/app/api/cart/[productId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';
import { client } from '@/lib/microcms/client'; // MicroCMSクライアントをインポート
import { syncProductToDatabase } from '@/lib/sync-utils';

export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    // パラメータを最初に確認（async/awaitを使用）
    const { productId } = params;
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    const { added, quantity = 1 } = data;

    // カートに追加する前に商品の存在確認
    let productIdToUse = productId;
    
    const productExists = await prisma.product.findUnique({
      where: {
        id: productIdToUse,
      },
    });

    if (!productExists) {
      console.log(`商品が見つかりません: ${productIdToUse}`);
      
      // MicroCMS IDを使用して検索
      const productByMicroCmsId = await prisma.product.findFirst({
        where: {
          microCmsId: productIdToUse,
        },
      });
      
      if (productByMicroCmsId) {
        // 正しいIDを使用
        productIdToUse = productByMicroCmsId.id;
        console.log(`MicroCMS IDでの検索結果: ${productIdToUse}`);
      } else {
        // 商品が見つからない場合、MicroCMSから取得して同期を試みる
        try {
          console.log(`MicroCMSから商品取得を試みます: ${productIdToUse}`);
          const microCmsProduct = await client.getListDetail({
            endpoint: 'rumini',
            contentId: productIdToUse,
          });
          
          if (microCmsProduct) {
            // データベースに同期
            const syncedProduct = await syncProductToDatabase(microCmsProduct);
            productIdToUse = syncedProduct.id;
            console.log(`商品を同期しました。新しいID: ${productIdToUse}`);
          } else {
            return NextResponse.json({ 
              error: '指定された商品はMicroCMSにも存在しません。', 
              productId: productIdToUse,
              success: false 
            }, { status: 404 });
          }
        } catch (error) {
          console.error('商品の自動同期に失敗しました:', error);
          return NextResponse.json({ 
            error: '指定された商品はデータベースに存在せず、自動同期にも失敗しました。', 
            productId: productIdToUse,
            success: false 
          }, { status: 404 });
        }
      }
    }
    
    // ユーザーのカートを取得または作成
    let cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
    });
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
        },
      });
    }
    
    
    if (added) {
      // カートアイテムを確認
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: productIdToUse,
        },
      });
      
      if (existingItem) {
        // 数量を更新
        await prisma.cartItem.update({
          where: {
            id: existingItem.id,
          },
          data: {
            quantity: existingItem.quantity + quantity,
          },
        });
      } else {
        // 新しいアイテムを追加
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: productIdToUse,
            quantity,
          },
        });
      }
    } else {
      // カートから削除
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId: productIdToUse,
        },
      });
    }
    
    // カートの更新時間を更新
    await prisma.cart.update({
      where: {
        id: cart.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({ success: true, added });
  } catch (error) {
    // エラーハンドリングを改善
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating cart:', errorMessage);
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  // パラメータを最初に確認
  if (!params || !params.productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  const productId = params.productId;

  try {
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // カートの状態を確認
    const cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          where: {
            productId,
          },
        },
      },
    });
    
    const inCart = cart?.items.length ? true : false;
    const quantity = cart?.items[0]?.quantity || 0;
    
    return NextResponse.json({ inCart, quantity });
  } catch (error) {
    // エラーハンドリングを改善
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error checking cart status:', errorMessage);
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}