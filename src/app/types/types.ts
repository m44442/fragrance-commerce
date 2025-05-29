// src/app/types/types.ts

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: string;
  }
}

// 商品の型定義
export interface productType {
  id: string;
  title: string;
  description?: string;
  price: number;
  discountPrice?: number | null;
  samplePrice?: number;
  specialPrice?: number;
  stock?: number;
  thumbnail?: { url: string };
  images?: { url: string }[];
  brand: string;
  brandId?: string;
  brandInfo?: {
    name: string;
    nameJp?: string;
    description?: string;
    logo?: { url: string };
    isFeatured?: boolean;
  };
  category?: string | string[];
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
  reviewCount?: number;
  celebrityPick?: boolean;
  celebrityInfo?: {
    name: string;
    type: string;
    comment?: string;
  };
  keywords?: string;
  publishedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  microCmsId?: string;
  microCmsUpdatedAt?: Date;
}

// ブランドの型定義
export interface BrandType {
  id: string;
  name: string;
  nameJp?: string;
  description?: string;
  tagline?: string;
  imageUrl?: string;
  logo?: { url: string };
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// カテゴリの型定義
export interface CategoryType {
  id: string;
  name: string;
  description?: string;
  type?: 'scent' | 'scene';
  imageUrl?: string;
  thumbnail?: { url: string };
  productCount?: number;
}

// テーマの型定義
export interface ThemeType {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
}

// セレブリティ香水の型定義
export interface CelebrityFragranceType {
  id: string;
  fragranceId: string;
  fragranceName: string;
  fragranceBrand: string;
  price: number;
  thumbnailUrl: string;
  celebrityName: string;
  celebrityType: string;
  description?: string;
}

// アトマイザーケースの型定義
export interface AtomizerCaseType {
  id: string;
  name: string;
  color: string;
  imageUrl: string;
  image?: { url: string };
  displayOrder?: number;
  isActive?: boolean;
}