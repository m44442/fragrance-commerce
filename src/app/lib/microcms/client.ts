// src/app/lib/microcms/client.ts
import { productType } from "@/types/types";
import { createClient } from "microcms-js-sdk";

export const client = createClient({
  serviceDomain: process.env.NEXT_PUBLIC_SERVICE_DOMAIN!,
  apiKey: process.env.NEXT_PUBLIC_API_KEY!,
});

// 共通のクエリビルダー関数
const buildQuery = (baseQuery: Record<string, any>, additionalQuery?: Record<string, any>) => {
  return {
    ...baseQuery,
    ...additionalQuery
  };
};

// 基本のリスト取得関数
export const getProductList = async (query?: Record<string, any>) => {
  return await client.getList<productType>({
    endpoint: "rumini",
    queries: buildQuery({ limit: 20 }, query)
  });
};

// 様々なユースケース用の関数
export const getAllProducts = async (additionalQuery?: Record<string, any>) => {
  return await getProductList(buildQuery({ limit: 100 }, additionalQuery));
};

export const getDetailProduct = async (contentId: string) => {
  return await client.getListDetail<productType>({
    endpoint: "rumini",
    contentId,
  });
};

export const getNewArrivals = async () => {
  return await getProductList({
    filters: 'isNew[equals]true',
    orders: '-publishedAt',
    limit: 50
  });
};

export const getRankingProducts = async () => {
  return await getProductList({
    filters: 'rank[greater_than]0',
    orders: 'rank',
    limit: 20
  });
};

// ブランド情報とカテゴリ情報取得関数
export const getFeaturedBrands = async () => {
  try {
    return await client.getList({
      endpoint: 'brands',
      queries: {
        filters: 'isFeatured[equals]true',
        limit: 10
      }
    });
  } catch (error) {
    console.error("Failed to fetch featured brands:", error);
    // フォールバック: 商品からブランドを抽出
    const products = await getAllProducts();
    const uniqueBrands = Array.from(new Set(
      products.contents.map(p => p.brand).filter(Boolean)
    )).slice(0, 10);
    
    return {
      contents: uniqueBrands.map((brand, index) => ({
        id: `brand-${index}`,
        name: brand,
        nameJp: brand,
        tagline: `${brand}の香水コレクション`,
        imageUrl: "/Rumini.jpg"
      }))
    };
  }
};

export const getCelebrityFragrances = async () => {
  try {
    return await client.getList({
      endpoint: 'celebrity_fragrances',
      queries: {
        limit: 20
      }
    });
  } catch (error) {
    console.error("Failed to fetch celebrity fragrances:", error);
    // フォールバック: 通常商品から一部を選択
    const products = await getAllProducts();
    const selectedProducts = products.contents.slice(0, 6);
    
    return {
      contents: selectedProducts.map((product, index) => ({
        id: `celebrity-${index}`,
        fragranceId: product.id,
        fragranceName: product.title,
        fragranceBrand: product.brand,
        price: product.price,
        thumbnailUrl: product.thumbnail?.url || '/Rumini.jpg',
        celebrityName: ['佐藤健', '橋本環奈', '菅田将暉', '新垣結衣', '山田涼介', '石原さとみ'][index],
        celebrityType: ['俳優', '女優', '俳優', '女優', 'アイドル', '女優'][index],
        description: `${product.title}の魅力的な香り`
      }))
    };
  }
};

// 商品をブランドごとにグループ化
export const getProductsByBrand = async () => {
  const result = await client.getList<productType>({
    endpoint: "rumini",
    queries: {
      fields: "id,title,brand,price,thumbnail,isNew,averageRating,reviewCount",
      limit: 100
    }
  });
  
  // ブランドごとに商品をグループ化
  const brandMap = new Map<string, productType[]>();
  
  result.contents.forEach(product => {
    if (product.brand) {
      if (!brandMap.has(product.brand)) {
        brandMap.set(product.brand, []);
      }
      brandMap.get(product.brand)?.push(product);
    }
  });
  
  // ブランドとその商品リストの配列を作成
  const brandProducts = Array.from(brandMap.entries()).map(([brandName, products]) => ({
    id: brandName.toLowerCase().replace(/\s+/g, '-'),
    name: brandName,
    products: products
  }));
  
  // ブランド名でアルファベット順にソート
  brandProducts.sort((a, b) => a.name.localeCompare(b.name));
  
  return brandProducts;
};

export const getCategoryProducts = async (category: string) => {
  return await getProductList({
    filters: `category[contains]${category}`,
    limit: 100
  });
};

export const getSceneProducts = async (scene: string) => {
  return await getProductList({
    filters: `scenes[contains]${scene}`,
    limit: 100
  });
};

export const getThemeProducts = async (theme: string) => {
  return await getProductList({
    filters: `themes[contains]${theme}`,
    limit: 100
  });
};

export const getCelebrityPicks = async () => {
  return await getProductList({
    filters: 'celebrityPick[equals]true',
    limit: 50
  });
};

export const getUniqueThemes = async () => {
  // 全商品を取得
  const allProducts = await client.getList<productType>({
    endpoint: "rumini",
    queries: {
      fields: "id,title,themes,thumbnail,description",
      limit: 100
    }
  });
  
  // テーマごとに商品をグループ化
  const themeMap = new Map();
  
  allProducts.contents.forEach(product => {
    if (product.themes && Array.isArray(product.themes)) {
      product.themes.forEach(themeId => {
        if (!themeMap.has(themeId)) {
          const themeName = (() => {
            if (themeId === 'popular') return '人気ランキング';
            if (themeId === 'new-trend') return '新着トレンド';
            if (themeId === 'best-value') return 'コスパ最強';
            if (themeId === 'gift') return 'ギフトにおすすめ';
            if (themeId === 'office') return 'オフィス向け';
            if (themeId === 'date') return 'デート向け';
            if (themeId === 'seasonal') return '季節のおすすめ';
            return themeId
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          })();
          
          themeMap.set(themeId, {
            id: themeId,
            name: themeName,
            description: `${themeName}テーマの商品コレクション`,
            products: [],
            thumbnail: null
          });
        }
        
        themeMap.get(themeId).products.push(product);
        
        if (!themeMap.get(themeId).thumbnail && product.thumbnail) {
          themeMap.get(themeId).thumbnail = product.thumbnail;
        }
      });
    }
  });
  
  const themes = Array.from(themeMap.values()).map(theme => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
    imageUrl: theme.thumbnail?.url,
    productCount: theme.products.length
  }));
  
  return {
    contents: themes
  };
};