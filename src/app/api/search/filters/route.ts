// src/app/api/search/filters/route.ts
import { NextResponse } from 'next/server';
import { client } from "@/lib/microcms/client";

export async function GET() {
  try {
    // すべての商品を取得
    const response = await client.getList({
      endpoint: 'rumini',
      queries: {
        limit: 100,
        fields: 'category,brand',
      },
    });
    
    const products = response.contents;
    
    // カテゴリの一覧を抽出
    const categories = Array.from(new Set(
      products
        .map(product => product.category)
        .filter(Boolean)
    )).sort();
    
    // ブランドの一覧を抽出
    const brands = Array.from(new Set(
      products
        .map(product => product.brand)
        .filter(Boolean)
    )).sort();
    
    return NextResponse.json({ categories, brands });
  } catch (error) {
    console.error('Error fetching filters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}