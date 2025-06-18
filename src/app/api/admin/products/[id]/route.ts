import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: '商品が見つかりません' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const {
      name,
      description,
      price,
      samplePrice,
      imageUrl,
      stock,
      sampleStock,
      isActive,
      brandId
    } = data;

    // バリデーション
    if (!name || !description || !brandId) {
      return NextResponse.json({ 
        error: '商品名、説明、ブランドは必須です' 
      }, { status: 400 });
    }

    if (price < 0 || samplePrice < 0 || stock < 0 || sampleStock < 0) {
      return NextResponse.json({ 
        error: '価格と在庫は0以上である必要があります' 
      }, { status: 400 });
    }

    // 商品の存在確認
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: '商品が見つかりません' }, { status: 404 });
    }

    // ブランドの存在確認
    const brand = await prisma.brand.findUnique({
      where: { id: brandId }
    });

    if (!brand) {
      return NextResponse.json({ 
        error: '指定されたブランドが見つかりません' 
      }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseInt(price),
        samplePrice: parseInt(samplePrice),
        imageUrl: imageUrl || null,
        stock: parseInt(stock),
        sampleStock: parseInt(sampleStock),
        isActive: Boolean(isActive),
        brandId
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // 商品の存在確認
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: '商品が見つかりません' }, { status: 404 });
    }

    // 関連データの確認（注文履歴がある場合は削除をブロック）
    const hasOrders = await prisma.orderItem.findFirst({
      where: { productId: id }
    });

    if (hasOrders) {
      return NextResponse.json({ 
        error: 'この商品は注文履歴があるため削除できません。非アクティブ化を検討してください。' 
      }, { status: 400 });
    }

    // カートアイテムの削除
    await prisma.cartItem.deleteMany({
      where: { productId: id }
    });

    // お気に入りの削除
    await prisma.favorite.deleteMany({
      where: { productId: id }
    });

    // レビューの削除
    await prisma.review.deleteMany({
      where: { productId: id }
    });

    // 商品の削除
    await prisma.product.delete({
      where: { id }
    });

    return NextResponse.json({ message: '商品が削除されました' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}