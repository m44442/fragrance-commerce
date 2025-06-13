"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/microcms/client";
import { productType } from "@/types/types";

export default function BrandPage() {
  const params = useParams();
  const brandId = params.brandId as string;
  const [products, setProducts] = useState<productType[]>([]);
  const [brandInfo, setBrandInfo] = useState<{
    name: string;
    description: string;
    totalProducts: number;
    priceRange: { min: number; max: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "name" | "new">("new");

  useEffect(() => {
    fetchBrandProducts();
  }, [brandId]);

  const fetchBrandProducts = async () => {
    try {
      const { contents } = await getAllProducts();
      
      // ブランド名をデコード（URLエンコードされている場合）
      const decodedBrand = decodeURIComponent(brandId);
      
      // ブランドの商品をフィルタリング
      const brandProducts = contents.filter(product => 
        product.brand?.toLowerCase() === decodedBrand.toLowerCase() ||
        product.brand?.toLowerCase().includes(decodedBrand.toLowerCase())
      );

      if (brandProducts.length > 0) {
        const prices = brandProducts.map(p => p.price);
        const brandName = brandProducts[0].brand;
        
        setBrandInfo({
          name: brandName || decodedBrand,
          description: getBrandDescription(brandName || decodedBrand),
          totalProducts: brandProducts.length,
          priceRange: {
            min: Math.min(...prices),
            max: Math.max(...prices)
          }
        });
      } else {
        setBrandInfo({
          name: decodedBrand,
          description: "このブランドの商品は現在準備中です。",
          totalProducts: 0,
          priceRange: { min: 0, max: 0 }
        });
      }
      
      setProducts(brandProducts);
    } catch (error) {
      console.error("Error fetching brand products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBrandDescription = (brandName: string): string => {
    const descriptions: { [key: string]: string } = {
      "Dior": "クリスチャン・ディオールが創業したフランスの高級ファッションブランド。エレガンスと革新性を兼ね備えた香水で世界中から愛されています。",
      "LOEWE": "1846年にマドリードで創業されたスペインの老舗ラグジュアリーブランド。洗練された香水とレザーグッズで知られています。",
      "Chanel": "フランスの象徴的なラグジュアリーブランド。No.5をはじめとする名香で香水界に革命をもたらしました。",
      "Tom Ford": "モダンで洗練された香水を手がけるアメリカのラグジュアリーブランド。大胆で官能的な香りが特徴です。",
      "Hermès": "フランスの老舗ラグジュアリーブランド。上質な素材と職人技が光る、エレガントな香水を展開しています。"
    };
    
    return descriptions[brandName] || `${brandName}の香水コレクション。洗練された香りをお楽しみください。`;
  };

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name":
        return a.title.localeCompare(b.title);
      case "new":
      default:
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="bg-gray-300 h-8 rounded mb-4 w-1/3"></div>
            <div className="bg-gray-300 h-4 rounded mb-8 w-2/3"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index}>
                  <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-300 h-4 rounded mb-2"></div>
                  <div className="bg-gray-300 h-4 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ブランドヘッダー */}
        <div className="mb-8">
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  ホーム
                </Link>
              </li>
              <li>
                <span className="text-gray-500">/</span>
              </li>
              <li>
                <Link href="/brands" className="text-gray-500 hover:text-gray-700">
                  ブランド
                </Link>
              </li>
              <li>
                <span className="text-gray-500">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{brandInfo?.name}</span>
              </li>
            </ol>
          </nav>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{brandInfo?.name}</h1>
          <p className="text-lg text-gray-600 mb-4">{brandInfo?.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>{brandInfo?.totalProducts}個の商品</span>
            {brandInfo?.priceRange && brandInfo.priceRange.max > 0 && (
              <span>
                価格帯: ¥{brandInfo.priceRange.min.toLocaleString()} - 
                ¥{brandInfo.priceRange.max.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* ソート機能 */}
        {products.length > 0 && (
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-500">
              {products.length}件の商品が見つかりました
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="new">新着順</option>
              <option value="price-asc">価格が安い順</option>
              <option value="price-desc">価格が高い順</option>
              <option value="name">名前順</option>
            </select>
          </div>
        )}

        {/* 商品一覧 */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {brandInfo?.name}の商品は現在準備中です
            </h3>
            <p className="text-gray-500 mb-6">
              他のブランドの商品もぜひご覧ください
            </p>
            <Link
              href="/brands"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              他のブランドを見る
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} className="group">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="aspect-square bg-gray-200 relative overflow-hidden">
                    {product.thumbnail?.url ? (
                      <Image
                        src={product.thumbnail.url}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                    <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {Array.isArray(product.category) ? product.category.join(", ") : product.category}
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          ¥{product.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}