// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from "@/lib/microcms/client";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const categories = url.searchParams.getAll('category');
  const brands = url.searchParams.getAll('brand');
  const minPrice = url.searchParams.get('minPrice');
  const maxPrice = url.searchParams.get('maxPrice');
  
  try {
    const filters = [];
    
    // カテゴリフィルター
    if (categories.length > 0) {
      const categoryFilters = categories.map(category => `category[equals]${category}`);
      filters.push(`(${categoryFilters.join(' [or] ')})`);
    }
    
    // ブランドフィルター
    if (brands.length > 0) {
      const brandFilters = brands.map(brand => `brand[equals]${brand}`);
      filters.push(`(${brandFilters.join(' [or] ')})`);
    }
    
    // 価格範囲フィルター
    if (minPrice) {
      filters.push(`price[greater_than]${minPrice}`);
    }
    
    if (maxPrice) {
      filters.push(`price[less_than]${maxPrice}`);
    }
    
    const filterQuery = filters.length > 0 ? filters.join(' [and] ') : '';
    
    // クライアントが利用できない場合のフォールバック
    if (!client) {
      return NextResponse.json({ 
        contents: [], 
        totalCount: 0, 
        offset: 0, 
        limit: 100 
      });
    }
    
    // MicroCMSへのリクエスト
    // qパラメータによる曖昧検索を使用
    const response = await client.getList({
      endpoint: 'rumini',
      queries: {
        q: query,             // 曖昧検索のためのqパラメータを設定
        filters: filterQuery, // フィルターによる絞り込み
        limit: 100,
      },
    });
    
    return NextResponse.json({ products: response.contents });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}