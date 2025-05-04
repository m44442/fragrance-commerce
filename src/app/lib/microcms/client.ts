// src/app/lib/microcms/client.ts
import { productType } from "@/types/types";
import { createClient } from "microcms-js-sdk";

export const client = createClient({
  serviceDomain: process.env.NEXT_PUBLIC_SERVICE_DOMAIN!,
  apiKey: process.env.NEXT_PUBLIC_API_KEY!,
});

// 通常の商品情報取得用
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

// 推し香水用のエンドポイント
export const getCelebrityFragrances = async () => {
  const result = await client.getList<any>({
    endpoint: "celebrity_fragrances", // 推し香水用のエンドポイント
  });
  return result;
};

// ランキング用のエンドポイント（既存）
export const getRankingProducts = async () => {
  const result = await client.getList<productType>({
    endpoint: "rumini_ranking",
  });
  return result;
};

// ブランド特集用のエンドポイント
export const getFeaturedBrands = async () => {
  const result = await client.getList<any>({
    endpoint: "featured_brands", // ブランド特集用のエンドポイント
  });
  return result;
};

// 新着商品用のエンドポイント
export const getNewArrivals = async () => {
  const result = await client.getList<productType>({
    endpoint: "new_arrivals", // 新着商品用のエンドポイント
    queries: {
      orders: "-publishedAt" // 公開日の新しい順
    }
  });
  return result;
};

// テーマ特集用のエンドポイント
export const getThemeCollections = async () => {
  const result = await client.getList<any>({
    endpoint: "theme_collections", // テーマ特集用のエンドポイント
  });
  return result;
};