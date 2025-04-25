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

type productType = {
    id: number,
    title: string,
    price: number,
    category: string,
    brand: string,
    description: string,
    thumbnail: { url: string},
    createdAt: string,
    updatedAt: string,
    rank: number
};

export type { productType };