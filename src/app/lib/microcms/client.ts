// src/app/lib/microcms/client.ts
import { productType } from "@/types/types";
import { createClient } from "microcms-js-sdk";

export const client = createClient({
  serviceDomain: process.env.NEXT_PUBLIC_SERVICE_DOMAIN!,
  apiKey: process.env.NEXT_PUBLIC_API_KEY!,
});

// 商品情報取得用関数
export const getAllProducts = async () => {
  const allProducts = await client.getList<productType>({
    endpoint: "rumini",
  });
  return allProducts;
};

export const getDetailProduct = async (contentId: string) => {
  const detailProduct = await client.getListDetail<productType>({
    endpoint: "rumini",
    contentId,
  });

  return detailProduct;
};

// 新着商品取得
export const getNewArrivals = async () => {
  return await client.getList<productType>({
    endpoint: "rumini",
    queries: {
      orders: '-publishedAt', // 公開日の新しい順
      limit: 50
    }
  });
};

// ランキング商品取得
export const getRankingProducts = async () => {
  return await client.getList<productType>({
    endpoint: "rumini",
    queries: {
      filters: 'rank[greater_than]0',
      orders: 'rank', // ランキング順
      limit: 20
    }
  });
};

// ブランド別商品取得
export const getBrandProducts = async (brandName: string) => {
  return await client.getList<productType>({
    endpoint: "rumini",
    queries: {
      filters: `brand[equals]${brandName}`,
      limit: 100
    }
  });
};

// カテゴリー別商品取得
export const getCategoryProducts = async (category: string) => {
  return await client.getList<productType>({
    endpoint: "rumini",
    queries: {
      filters: `category[contains]${category}`,
      limit: 100
    }
  });
};

// シーン別商品取得
export const getSceneProducts = async (scene: string) => {
  return await client.getList<productType>({
    endpoint: "rumini",
    queries: {
      filters: `scenes[contains]${scene}`,
      limit: 100
    }
  });
};

// テーマ別商品取得
export const getThemeProducts = async (theme: string) => {
  return await client.getList<productType>({
    endpoint: "rumini",
    queries: {
      filters: `themes[contains]${theme}`,
      limit: 100
    }
  });
};

// 推し香水商品取得
export const getCelebrityPicks = async () => {
  return await client.getList<productType>({
    endpoint: "rumini",
    queries: {
      filters: 'celebrityPick[equals]true',
      limit: 50
    }
  });
};