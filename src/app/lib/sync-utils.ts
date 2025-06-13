// src/lib/sync-utils.ts
import { client } from '@/lib/microcms/client';
import { prisma } from '@/lib/prisma';
import { productType } from '@/types/types';

export async function syncProductToDatabase(microCmsProduct: productType) {
  try {
    // ブランド情報を取得または作成
    let brandId;
    const existingBrand = await prisma.brand.findFirst({
      where: { name: microCmsProduct.brand },
    });
    
    if (existingBrand) {
      brandId = existingBrand.id;
    } else {
      const newBrand = await prisma.brand.create({
        data: {
          name: microCmsProduct.brand,
          nameJp: microCmsProduct.brand,
          description: microCmsProduct.brandInfo?.description || '',
          isFeatured: microCmsProduct.brandInfo?.isFeatured || false,
        },
      });
      brandId = newBrand.id;
    }
    
    // 商品の基本データを準備
    const productData = {
      name: microCmsProduct.title,
      brandId,
      description: microCmsProduct.description || '',
      price: microCmsProduct.price || 0,
      discountPrice: microCmsProduct.discountPrice || null,
      stock: microCmsProduct.stock || 10,
      thumbnailUrl: microCmsProduct.thumbnail?.url || null,
      microCmsId: microCmsProduct.id,
      microCmsUpdatedAt: new Date(microCmsProduct.updatedAt || new Date()),
      topNotes: microCmsProduct.topNotes || '',
      middleNotes: microCmsProduct.middleNotes || '',
      baseNotes: microCmsProduct.baseNotes || '',
      volume: microCmsProduct.volume || null,
      concentration: microCmsProduct.concentration || '',
      isPublished: microCmsProduct.isPublished !== false,
      isNew: microCmsProduct.isNew || false,
      isFeatured: microCmsProduct.isFeatured || false,
    };
    
    // 既存の商品をチェック
    const existingProduct = await prisma.product.findFirst({
      where: { microCmsId: microCmsProduct.id },
    });
    
    if (existingProduct) {
      // 既存の商品を更新
      return await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData,
      });
    } else {
      // 新しい商品を作成
      return await prisma.product.create({
        data: productData,
      });
    }
  } catch (error) {
    console.error("商品同期エラー:", error);
    throw error;
  }
}

// MicroCMSから商品を取得してデータベースに同期する関数
export async function syncAllProductsFromMicroCMS() {
  try {
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
    
    for (const product of products) {
      try {
        const existingProduct = await prisma.product.findFirst({
          where: { microCmsId: product.id },
        });
        
        if (existingProduct) {
          await syncProductToDatabase(product);
          syncResults.updated++;
        } else {
          await syncProductToDatabase(product);
          syncResults.created++;
        }
      } catch (error) {
        console.error(`Error syncing product ${product.id}:`, error);
        syncResults.errors++;
      }
    }
    
    return syncResults;
  } catch (error) {
    console.error('全商品同期エラー:', error);
    throw error;
  }
}