"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/microcms/client";
import { productType } from "@/types/types";

interface ThemeData {
  id: string;
  name: string;
  description: string;
  products: productType[];
  backgroundImage?: string;
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<ThemeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const { contents } = await getAllProducts();
      
      // テーマごとに商品をグループ化
      const themeGroups: { [key: string]: ThemeData } = {
        "popular": {
          id: "popular",
          name: "人気ランキング",
          description: "最も人気の高い香水コレクション",
          products: [],
          backgroundImage: "/subscription_banner.jpg"
        },
        "new-trend": {
          id: "new-trend", 
          name: "新着トレンド",
          description: "最新トレンドの香水をチェック",
          products: [],
          backgroundImage: "/S__35864588.jpg"
        },
        "luxury": {
          id: "luxury",
          name: "ラグジュアリー",
          description: "高級ブランドの特別な香水",
          products: [],
          backgroundImage: "/S__35192865_0.jpg"
        },
        "daily": {
          id: "daily",
          name: "デイリーユース",
          description: "毎日使いたくなる香水",
          products: [],
          backgroundImage: "/Rumini.jpg"
        },
        "seasonal": {
          id: "seasonal",
          name: "シーズナル",
          description: "季節に合わせた香水セレクション",
          products: [],
        },
        "unisex": {
          id: "unisex",
          name: "ユニセックス",
          description: "男女問わず楽しめる香水",
          products: [],
        }
      };

      // 商品をテーマごとに分類
      contents.forEach((product: any) => {
        if (product.themes && product.themes.length > 0) {
          product.themes.forEach((theme: any) => {
            const themeKey = theme.split(" ")[0]; // "popular (人気ランキング)" -> "popular"
            if (themeGroups[themeKey]) {
              themeGroups[themeKey].products.push(product);
            }
          });
        }
        
        // 価格によるラグジュアリー分類
        if (product.price >= 50000) {
          themeGroups.luxury.products.push(product);
        }
        
        // 価格によるデイリーユース分類
        if (product.price <= 10000) {
          themeGroups.daily.products.push(product);
        }
      });

      // ユニセックス（全商品から一部を選択）
      themeGroups.unisex.products = contents.slice(0, 8);
      
      // シーズナル（フローラル系など季節感のある香水）
      themeGroups.seasonal.products = contents.filter((product: any) => {
        if (!product.category) return false;
        const categories = Array.isArray(product.category) ? product.category : [product.category];
        return categories.some((cat: any) => 
          cat.includes("floral") || cat.includes("citrus") || cat.includes("fresh")
        );
      }).slice(0, 8);

      const themesArray = Object.values(themeGroups).filter((theme: any) => theme.products.length > 0);
      setThemes(themesArray);
    } catch (error) {
      console.error("Error fetching themes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">テーマ</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                <div className="bg-gray-300 h-6 rounded mb-2"></div>
                <div className="bg-gray-300 h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">香水テーマコレクション</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            あなたの気分やシーンに合わせて、様々なテーマから香水をお選びいただけます
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {themes.map((theme) => (
            <Link 
              key={theme.id} 
              href={`/themes/${theme.id}`}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-400">
                  {theme.backgroundImage ? (
                    <Image
                      src={theme.backgroundImage}
                      alt={theme.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400"></div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold mb-1">{theme.name}</h3>
                    <p className="text-sm opacity-90">{theme.products.length}個の商品</p>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{theme.description}</p>
                  
                  {/* 商品プレビュー */}
                  <div className="flex -space-x-2 mb-4">
                    {theme.products.slice(0, 4).map((product, index) => (
                      <div
                        key={product.id}
                        className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden"
                        style={{ zIndex: 4 - index }}
                      >
                        {product.thumbnail?.url && (
                          <Image
                            src={product.thumbnail.url}
                            alt={product.title}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        )}
                      </div>
                    ))}
                    {theme.products.length > 4 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                        +{theme.products.length - 4}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      価格帯: ¥{Math.min(...theme.products.map(p => p.price)).toLocaleString()} - 
                      ¥{Math.max(...theme.products.map(p => p.price)).toLocaleString()}
                    </span>
                    <span className="text-indigo-600 font-medium group-hover:text-indigo-700">
                      詳細を見る →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}