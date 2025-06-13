// src/app/celebrity-fragrances/page.tsx
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { getCelebrityFragrances } from "@/lib/microcms/client";

interface CelebrityFragrance {
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

// 推し香水カテゴリ
const categories = [
  { id: "all", name: "すべて" },
  { id: "actor", name: "俳優・女優" },
  { id: "singer", name: "歌手" },
  { id: "idol", name: "アイドル" },
  { id: "model", name: "モデル" },
];

const CelebrityFragrancesPage = () => {
  const [celebrities, setCelebrities] = useState<CelebrityFragrance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const fetchCelebrityFragrances = async () => {
      try {
        const result = await getCelebrityFragrances();
        setCelebrities(result.contents || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch celebrity fragrances:", error);
        setIsLoading(false);
      }
    };

    fetchCelebrityFragrances();
  }, []);

  // カテゴリでフィルタリング
  const filteredCelebrities = selectedCategory === "all" 
    ? celebrities 
    : celebrities.filter(celeb => {
        const type = celeb.celebrityType.toLowerCase();
        if (selectedCategory === "actor") return type.includes("俳優") || type.includes("女優");
        if (selectedCategory === "singer") return type.includes("歌手");
        if (selectedCategory === "idol") return type.includes("アイドル");
        if (selectedCategory === "model") return type.includes("モデル");
        return true;
      });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">推し香水コレクション</h1>
        <div className="flex justify-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-custom-peach rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">推し香水コレクション</h2>
        <Link href="/celebrity-picks" className="text-custom-peach text-sm font-medium hover:text-custom-peach-dark transition-colors flex items-center">
          もっと見る
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      
      
      {/* 商品グリッド - ホームページでは6件のみ表示 */}
      <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 lg:gap-6">
        {filteredCelebrities.slice(0, 6).map(item => (
          <Link key={item.id} href={`/products/${item.fragranceId}`} className="bg-white rounded-lg shadow overflow-hidden block hover:shadow-lg transition-shadow">
            <div className="relative aspect-square">
              {item.thumbnailUrl ? (
                <Image 
                  src={item.thumbnailUrl} 
                  alt={item.fragranceName} 
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  No Image
                </div>
              )}
              
              {/* 推し名表示のタグ */}
              <div className="absolute top-1 left-1 bg-custom-peach text-white px-1.5 py-0.5 rounded-full flex items-center text-xs">
                <Star className="w-3 h-3 mr-0.5" />
                <span className="font-medium text-xs truncate max-w-16">{item.celebrityName}</span>
              </div>
              
              {/* お気に入りボタン */}
              <button className="absolute top-1 right-1 w-6 h-6 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                <Heart className="w-3 h-3 text-gray-500 hover:text-red-500" />
              </button>
            </div>
            
            <div className="p-1.5 md:p-3">
              <p className="text-xs text-gray-500 truncate mb-1">{item.fragranceBrand}</p>
              <h2 className="text-xs font-medium mb-1 line-clamp-2 leading-tight">{item.fragranceName}</h2>
              <div className="text-xs font-bold text-custom-peach">
                ¥{item.price?.toLocaleString()}
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {filteredCelebrities.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">該当する商品がありません</p>
        </div>
      )}
    </div>
  );
};

export default CelebrityFragrancesPage;