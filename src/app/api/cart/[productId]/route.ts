import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/next-auth/options';
import { prisma } from '@/lib/prisma';

// GET: カート内の商品を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        cart: {
          userId: session.user.id
        },
        productId: productId
      },
      include: {
        product: true
      }
    });

    return NextResponse.json(cartItem);
  } catch (error) {
    console.error('Error fetching cart item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: カートに商品を追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('=== Cart POST Debug ===');
    console.log('Session:', JSON.stringify(session, null, 2));
    console.log('Session user ID:', session?.user?.id);
    console.log('Session user email:', session?.user?.email);
    
    if (!session?.user?.id) {
      console.log('ERROR: No user ID in session');
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasUserId: !!session?.user?.id,
          hasUserEmail: !!session?.user?.email,
          session: session
        }
      }, { status: 401 });
    }

    const { productId } = await params;
    const { quantity = 1, isSample = false } = await request.json();

    console.log('Product ID:', productId);
    console.log('Quantity:', quantity);
    console.log('Is Sample:', isSample);

    // MicroCMSのIDの場合、対応するProductレコードを探すか作成
    let product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: productId },
          { microCmsId: productId }
        ]
      }
    });

    console.log('Found product in DB:', !!product);

    if (!product) {
      console.log('Product not found in DB, fetching from MicroCMS...');
      // MicroCMSから商品情報を取得して、Productテーブルに作成
      try {
        const { getAllProducts } = await import('@/lib/microcms/client');
        const { contents } = await getAllProducts();
        const microCmsProduct = contents.find(p => p.id === productId);
        
        console.log('MicroCMS products count:', contents.length);
        console.log('Found MicroCMS product:', !!microCmsProduct);
        
        if (!microCmsProduct) {
          console.log('Product not found in MicroCMS either');
          return NextResponse.json({ 
            error: 'Product not found',
            debug: {
              productId,
              searchedInDb: true,
              searchedInMicroCms: true,
              microCmsProductsCount: contents.length
            }
          }, { status: 404 });
        }

        // ブランドを取得または作成
        let brand = await prisma.brand.findUnique({
          where: { name: microCmsProduct.brand }
        });

        if (!brand) {
          brand = await prisma.brand.create({
            data: { name: microCmsProduct.brand }
          });
        }

        // Productレコードを作成
        product = await prisma.product.create({
          data: {
            name: microCmsProduct.title,
            brandId: brand.id,
            description: microCmsProduct.description?.replace(/<[^>]*>/g, '') || '',
            price: microCmsProduct.price,
            stock: 100, // デフォルト在庫
            thumbnailUrl: microCmsProduct.thumbnail?.url,
            microCmsId: microCmsProduct.id,
            microCmsUpdatedAt: new Date(microCmsProduct.updatedAt),
            isPublished: true,
            isNew: microCmsProduct.isNew || false,
            isFeatured: microCmsProduct.isFeatured || false
          }
        });
      } catch (createError) {
        console.error('Error creating product record:', createError);
        return NextResponse.json({ error: 'Failed to create product record' }, { status: 500 });
      }
    }

    // ユーザーのカートを取得または作成
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id }
      });
    }

    // カート内の既存アイテムを確認（お試しサイズと通常サイズは別管理）
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: product.id, // 実際のProductレコードのIDを使用
        isSample: isSample
      }
    });

    if (existingItem) {
      // 既存アイテムの数量を更新
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true }
      });
      return NextResponse.json(updatedItem);
    } else {
      // 新しいアイテムを追加
      const newItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id, // 実際のProductレコードのIDを使用
          quantity: quantity,
          isSample: isSample
        },
        include: { product: true }
      });
      return NextResponse.json(newItem);
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: カートから商品を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;
    
    console.log('=== Deleting cart item ===');
    console.log('userId:', session.user.id);
    console.log('productId:', productId);

    const result = await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: session.user.id
        },
        productId: productId
      }
    });
    
    console.log('Deleted items count:', result.count);

    return NextResponse.json({ success: true, deletedCount: result.count });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}