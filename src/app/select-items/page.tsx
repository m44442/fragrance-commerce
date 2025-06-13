// src/app/select-items/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Heart } from "lucide-react";
import { getAllProducts } from "@/lib/microcms/client";
import { productType } from "@/types/types";

const SelectItemsPage = () => {
  const [products, setProducts] = useState<productType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'theme', 'season', 'occasion'
  
  // 商品データの取得
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { contents } = await getAllProducts();
        // セレクトアイテムらしい商品をフィルタリング
        const selectItems = contents.filter((product: any) => 
          product.category || 
          product.themes || 
          product.isFeatured ||
          (product.averageRating && product.averageRating >= 4.0)
        );
        setProducts(selectItems);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch select items:", error);
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // フィルタリングされた商品のリスト
  const filteredProducts = products.filter(product => {
    if (filter === "all") return true;
    if (filter === "theme" && product.themes) return true;
    if (filter === "season" && product.category?.includes("季節")) return true;
    if (filter === "occasion" && product.category?.includes("シーン")) return true;
    return false;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ヘッダー部分 */}
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">セレクトアイテム</h1>
      </div>

      {/* 説明文 */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          シーン別や香り別など、多彩なテーマごとにアイテムをセレクトしています。
          厳選された香水の中から、あなたにぴったりの一本を見つけてください。
        </p>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap space-x-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-full mb-2 ${
            filter === "all"
              ? "bg-custom-peach text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          すべて
        </button>
        <button
          onClick={() => setFilter("theme")}
          className={`px-4 py-2 rounded-full mb-2 ${
            filter === "theme"
              ? "bg-custom-peach text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          テーマ別
        </button>
        <button
          onClick={() => setFilter("season")}
          className={`px-4 py-2 rounded-full mb-2 ${
            filter === "season"
              ? "bg-custom-peach text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          季節のおすすめ
        </button>
        <button
          onClick={() => setFilter("occasion")}
          className={`px-4 py-2 rounded-full mb-2 ${
            filter === "occasion"
              ? "bg-custom-peach text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          シーン別
        </button>
      </div>
      
      {/* 情報表示 */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          {filteredProducts.length}件のセレクトアイテムがあります
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-custom-peach rounded-full border-t-transparent"></div>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-64">
                {product.thumbnail?.url ? (
                  <Image 
                    src={product.thumbnail.url} 
                    alt={product.title} 
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    No Image
                  </div>
                )}
                
                {/* セレクトバッジ */}
                <div className="absolute top-4 left-4 bg-custom-peach text-white px-3 py-1 rounded-full flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  <span className="font-medium">SELECT</span>
                </div>
                
                {/* お気に入りボタン */}
                <button className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-gray-500 hover:text-red-500" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">{product.brand}</span>
                  <span className="text-sm text-custom-peach">{product.category}</span>
                </div>
                
                <h2 className="text-lg font-medium mb-2">{product.title}</h2>
                
                <div className="flex justify-center items-center">
                  <span className="text-lg font-bold">¥{product.price?.toLocaleString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">表示する商品がありません</p>
        </div>
      )}
    </div>
  );
};

export default SelectItemsPage;