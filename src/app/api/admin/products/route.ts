import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: {
        brand: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      name,
      description,
      price,
      discountPrice,
      thumbnailUrl,
      stock,
      isPublished,
      brandId
    } = data;

    // バリデーション
    if (!name || !description || !brandId) {
      return NextResponse.json({ 
        error: '商品名、説明、ブランドは必須です' 
      }, { status: 400 });
    }

    if (price < 0 || (discountPrice && discountPrice < 0) || stock < 0) {
      return NextResponse.json({ 
        error: '価格と在庫は0以上である必要があります' 
      }, { status: 400 });
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

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseInt(price),
        discountPrice: discountPrice ? parseInt(discountPrice) : null,
        thumbnailUrl: thumbnailUrl || null,
        stock: parseInt(stock),
        isPublished: Boolean(isPublished),
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

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}