// src/app/api/cron/microcms-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/microcms/client';
import prisma from '@/lib/prisma';

// 認証チェック関数
const validateCronRequest = (request: NextRequest) => {
  const authHeader = request.headers.get('Authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET_TOKEN}`;
  
  return authHeader === expectedToken;
};

export async function GET(request: NextRequest) {
  // クロンジョブの認証をチェック
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // MicroCMSから商品一覧を取得
    const response = await client.getList({
      endpoint: 'rumini',
      queries: {
        limit: 100,
      },
    });
    
    const products = response.contents;
    const syncResults = {
      created: 0,
      updated: 0,
      errors: 0,
    };
    
    // 各商品を処理
    for (const product of products) {
      try {
        // 既存の商品をチェック
        const existingProduct = await prisma.product.findFirst({
          where: {
            microCmsId: product.id,
          },
        });
        
        // ブランド情報を取得または作成
        let brandId;
        const existingBrand = await prisma.brand.findFirst({
          where: {
            name: product.brand,
          },
        });
        
        if (existingBrand) {
          brandId = existingBrand.id;
        } else {
          // 新しいブランドを作成
          const newBrand = await prisma.brand.create({
            data: {
              name: product.brand,
              nameJp: product.brand,
              description: '',
              isFeatured: false,
            },
          });
          brandId = newBrand.id;
        }
        
        // 商品の基本データを準備
        const productData = {
          name: product.title,
          brandId,
          description: product.description || '',
          price: product.price,
          discountPrice: product.discountPrice || null,
          stock: product.stock || 10,
          thumbnailUrl: product.thumbnail?.url || null,
          microCmsId: product.id,
          microCmsUpdatedAt: new Date(product.updatedAt),
          topNotes: product.topNotes || '',
          middleNotes: product.middleNotes || '',
          baseNotes: product.baseNotes || '',
          volume: product.volume || null,
          concentration: product.concentration || '',
          isPublished: true,
          isNew: product.isNew || false,
          isFeatured: product.isFeatured || false,
        };
        
        if (existingProduct) {
          // 既存の商品を更新
          await prisma.product.update({
            where: {
              id: existingProduct.id,
            },
            data: productData,
          });
          syncResults.updated++;
        } else {
          // 新しい商品を作成
          await prisma.product.create({
            data: productData,
          });
          syncResults.created++;
        }
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
        syncResults.errors++;
      }
    }
    
    return NextResponse.json({
      success: true,
      syncResults,
      message: `Sync completed: ${syncResults.created} created, ${syncResults.updated} updated, ${syncResults.errors} errors`,
    });
  } catch (error) {
    console.error('MicroCMS sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}