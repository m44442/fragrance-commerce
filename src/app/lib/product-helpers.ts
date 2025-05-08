import prisma from '@/lib/prisma';


/**
 * マイクロCMS IDからPrismaのプロダクトIDを探す
 * どちらのIDも受け入れるように設計されています
 */
export async function resolveProductId(id: string): Promise<string | null> {
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

  return product?.id || null;
}