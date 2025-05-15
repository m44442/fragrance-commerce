// src/app/new-arrivals/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Filter, Tag } from "lucide-react";
import { getNewArrivals } from "@/lib/microcms/client";
import { productType } from "@/types/types";

const NewArrivalsPage = () => {
  const [products, setProducts] = useState<productType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'this-week', 'this-month'
  const [view, setView] = useState("grid"); // 'grid', 'list'
  
  // 商品のフィルター用日付範囲
  const getDateRange = (filter: string) => {
    const now = new Date();
    if (filter === "this-week") {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return oneWeekAgo;
    } else if (filter === "this-month") {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return oneMonthAgo;
    }
    return null; // すべて表示する場合
  };

  // 商品データの取得
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // MicroCMSから新着商品を取得
        const result = await getNewArrivals();
        
        // 日付順に並べ替え
        const sortedProducts = (result.contents || []).sort((a, b) => {
          const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return dateB - dateA; // 降順（新しい順）
        });
        
        setProducts(sortedProducts);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch new arrivals:", error);
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // フィルタリングされた商品のリスト
  const filteredProducts = products.filter(product => {
    const dateRange = getDateRange(filter);
    if (!dateRange) return true;
    
    // publishedAtが存在する場合に日付比較
    if (product.publishedAt) {
      const publishDate = new Date(product.publishedAt);
      return publishDate >= dateRange;
    }
    
    // 日付情報がない場合はすべて表示
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ヘッダー部分 */}
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">新着商品</h1>
      </div>

      {/* フィルターとビュー切り替え */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex space-x-2 mb-2 md:mb-0">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full ${
              filter === "all"
                ? "bg-custom-peach text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setFilter("this-week")}
            className={`px-4 py-2 rounded-full ${
              filter === "this-week"
                ? "bg-custom-peach text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            今週
          </button>
          <button
            onClick={() => setFilter("this-month")}
            className={`px-4 py-2 rounded-full ${
              filter === "this-month"
                ? "bg-custom-peach text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            今月
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded ${
              view === "grid" ? "bg-gray-200" : "bg-gray-100"
            }`}
            aria-label="グリッド表示"
          >
            <div className="grid grid-cols-2 gap-1 w-6 h-6">
              <div className="bg-gray-500 rounded-sm"></div>
              <div className="bg-gray-500 rounded-sm"></div>
              <div className="bg-gray-500 rounded-sm"></div>
              <div className="bg-gray-500 rounded-sm"></div>
            </div>
          </button>
          
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded ${
              view === "list" ? "bg-gray-200" : "bg-gray-100"
            }`}
            aria-label="リスト表示"
          >
            <div className="flex flex-col space-y-1 w-6 h-6 justify-center">
              <div className="h-1 bg-gray-500 rounded-sm"></div>
              <div className="h-1 bg-gray-500 rounded-sm"></div>
              <div className="h-1 bg-gray-500 rounded-sm"></div>
            </div>
          </button>
        </div>
      </div>
      
      {/* 情報表示 */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          {filteredProducts.length}件の商品があります
          {filter === "this-week" && "（今週追加）"}
          {filter === "this-month" && "（今月追加）"}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-custom-peach rounded-full border-t-transparent"></div>
        </div>
      ) : filteredProducts.length > 0 ? (
        view === "grid" ? (
          // グリッドビュー
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="block bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow"
              >
                {/* 新着バッジ */}
                <div className="relative">
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                    NEW
                  </div>
                  
                  {/* 商品画像 */}
                  <div className="h-40 bg-gray-200 relative">
                    {product.thumbnail?.url ? (
                      <Image 
                        src={product.thumbnail.url} 
                        alt={product.title} 
                        layout="fill" 
                        objectFit="cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 商品情報 */}
                <div className="p-3">
                  <p className="text-xs text-gray-500">{product.brand}</p>
                  <h3 className="text-sm font-medium truncate">{product.title}</h3>
                  <div className="flex justify-between items-center mt-1">
                    {product.category && (
                      <p className="text-xs text-pink-500">{product.category}</p>
                    )}
                    <p className="text-sm font-semibold">¥{product.price?.toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          // リストビュー
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="flex bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow"
              >
                {/* 商品画像 */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 relative flex-shrink-0">
                  {product.thumbnail?.url ? (
                    <Image 
                      src={product.thumbnail.url} 
                      alt={product.title} 
                      layout="fill" 
                      objectFit="cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  {/* 新着バッジ */}
                  <div className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded-full">
                    NEW
                  </div>
                </div>
                
                {/* 商品情報 */}
                <div className="p-3 flex-grow">
                  <p className="text-xs text-gray-500">{product.brand}</p>
                  <h3 className="text-sm font-medium">{product.title}</h3>
                  <div className="flex flex-wrap mt-1 gap-2">
                    {product.category && (
                      <span className="flex items-center text-xs text-pink-500">
                        <Tag className="w-3 h-3 mr-1" />
                        {product.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold mt-2">¥{product.price?.toLocaleString()}</p>
                  {product.publishedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(product.publishedAt).toLocaleDateString('ja-JP')} 追加
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">表示する商品がありません</p>
        </div>
      )}
    </div>
  );
};

export default NewArrivalsPage;