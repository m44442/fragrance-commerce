import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * NextAuth.js のデフォルト型を拡張して id プロパティを追加
   */
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    // 必要に応じて他のユーザープロパティを追加
  }
}

// 商品の型定義を更新
interface productType {
  id: string;
  title: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  thumbnail?: { url: string };
  images?: { url: string }[];
  brand: string;
  brandInfo?: {
    name: string;
    nameJp?: string;
    description?: string;
    logo?: { url: string };
    isFeatured?: boolean;
  };
  category?: string[];
  topNotes?: string;
  middleNotes?: string;
  baseNotes?: string;
  volume?: number;
  concentration?: string;
  scenes?: string[];
  themes?: string[];
  themeDescription?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isPublished?: boolean;
  rank?: number;
  averageRating?: number;
  reviewCount: number;
  celebrityPick?: boolean;
  celebrityInfo?: {
    name: string;
    type: string;
    comment?: string;
  };
  keywords?: string;
  publishedAt?: string;
  updatedAt?: string;
}

export type { productType };