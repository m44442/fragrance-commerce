import prisma from '@/lib/prisma';
import { client } from '@/lib/microcms/client';

/**
 * マイクロCMS IDからPrismaのプロダクトIDを探す
 * どちらのIDも受け入れるように設計されています
 */
export async function resolveProductId(id: string): Promise<string | null> {
  console.log(`Resolving product ID: ${id}`);
  
  // まずIDでそのまま商品を検索
  let product = await prisma.product.findUnique({
    where: { id },
    select: { id: true }
  });

  // 見つからなければマイクロCMS IDとして検索
  if (!product) {
    product = await prisma.product.findFirst({
      where: { microCmsId: id },
      select: { id: true }
    });
  }

  // それでも見つからなければ、マイクロCMSから取得して同期を試みる
  if (!product) {
    try {
      console.log(`MicroCMSから商品取得を試みます: ${id}`);
      const microCmsProduct = await client.getListDetail({
        endpoint: 'rumini',
        contentId: id,
      });
      
      if (microCmsProduct) {
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
              nameJp: microCmsProduct.brand || '',
              description: '',
              isFeatured: false,
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
        
        // 新しい商品を作成
        const newProduct = await prisma.product.create({
          data: productData,
        });
        
        return newProduct.id;
      }
    } catch (error) {
      console.error('商品の自動同期に失敗しました:', error);
    }
    
    // 最終的に見つからなければ、デフォルトのブランドで商品を作成
    try {
      console.log("商品が見つからないため、フォールバックレコードを作成します");
      
      // デフォルトブランドの取得または作成
      let defaultBrand = await prisma.brand.findFirst({
        where: { name: "Unknown" },
      });
      
      if (!defaultBrand) {
        defaultBrand = await prisma.brand.create({
          data: {
            name: "Unknown",
            nameJp: "不明",
            description: "Default brand for products with unknown origin",
            isFeatured: false
          }
        });
      }
      
      // 商品をデータベースに登録
      const fallbackProduct = await prisma.product.create({
        data: {
          name: `Product ${id}`,
          brandId: defaultBrand.id,
          price: 0,
          stock: 0,
          microCmsId: id,
          microCmsUpdatedAt: new Date(),
        },
      });
      
      console.log("フォールバック商品レコードを作成しました:", fallbackProduct.id);
      return fallbackProduct.id;
    } catch (err) {
      console.error("フォールバック商品の作成に失敗:", err);
      return null;
    }
  }

  return product.id;
}