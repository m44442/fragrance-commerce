// src/app/api/debug/sync-product/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { client } from '@/lib/microcms/client';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    
    // MicroCMSから商品を取得
    const microCmsProduct = await client.getListDetail({
      endpoint: 'rumini',
      contentId: id,
    });
    
    if (!microCmsProduct) {
      return NextResponse.json({ error: 'Product not found in MicroCMS' }, { status: 404 });
    }
    
    // ブランド情報を取得または作成
    let brandId;
    const existingBrand = await prisma.brand.findFirst({
      where: {
        name: microCmsProduct.brand,
      },
    });
    
    if (existingBrand) {
      brandId = existingBrand.id;
    } else {
      // 新しいブランドを作成
      const newBrand = await prisma.brand.create({
        data: {
          name: microCmsProduct.brand,
          nameJp: microCmsProduct.brand,
          description: '',
          isFeatured: false,
        },
      });
      brandId = newBrand.id;
    }
    
    // ...existing code...
    // 商品の基本データを準備
    const productData = {
      name: microCmsProduct.title,
      brandId,
      description: microCmsProduct.description || '',
      price: microCmsProduct.price,
      discountPrice: microCmsProduct.discountPrice || null,
      stock: microCmsProduct.stock || 10,
      thumbnailUrl: microCmsProduct.thumbnail?.url || null,
      microCmsId: microCmsProduct.id,
      microCmsUpdatedAt: new Date(microCmsProduct.updatedAt),
      topNotes: microCmsProduct.topNotes || '',
      middleNotes: microCmsProduct.middleNotes || '',
      baseNotes: microCmsProduct.baseNotes || '',
      volume: microCmsProduct.volume || null,
      concentration: microCmsProduct.concentration || '',
      isPublished: true,
      isNew: microCmsProduct.isNew || false,
      isFeatured: microCmsProduct.isFeatured || false,
    };
    
    // 既存の商品をチェック
    const existingProduct = await prisma.product.findFirst({
      where: {
        microCmsId: microCmsProduct.id,
      },
    });
    
    let product;
    if (existingProduct) {
      // 既存の商品を更新
      product = await prisma.product.update({
        where: {
          id: existingProduct.id,
        },
        data: productData,
      });
    } else {
      // 新しい商品を作成
      product = await prisma.product.create({
        data: productData,
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: existingProduct ? 'Product updated' : 'Product created',
      product 
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ 
      error: 'Sync error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}