// src/app/celebrity-fragrances/page.tsx
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Heart, ArrowLeft } from "lucide-react";
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/" className="mr-4">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold">推し香水コレクション</h1>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-custom-peach rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ヘッダー部分 */}
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">推し香水コレクション</h1>
      </div>
      
      {/* カテゴリフィルター */}
      <div className="flex overflow-x-auto space-x-2 mb-6 py-2">
        {categories.map(category => (
          <button
            key={category.id}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              selectedCategory === category.id 
                ? "bg-custom-peach text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {/* 情報表示 */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          {filteredCelebrities.length}件の商品があります
          {selectedCategory !== "all" && ` （${categories.find(cat => cat.id === selectedCategory)?.name}）`}
        </p>
      </div>
      
      {/* 商品グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCelebrities.map(item => (
          <Link key={item.id} href={`/products/${item.fragranceId}`} className="bg-white rounded-lg shadow overflow-hidden block hover:shadow-lg transition-shadow">
            <div className="relative h-64">
              {item.thumbnailUrl ? (
                <Image 
                  src={item.thumbnailUrl} 
                  alt={item.fragranceName} 
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  No Image
                </div>
              )}
              
              {/* 推し名表示のタグ */}
              <div className="absolute top-4 left-4 bg-custom-peach text-white px-3 py-1 rounded-full flex items-center">
                <Star className="w-4 h-4 mr-1" />
                <span className="font-medium">{item.celebrityName}</span>
              </div>
              
              {/* お気に入りボタン */}
              <button className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-gray-500 hover:text-red-500" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">{item.fragranceBrand}</span>
                <span className="text-sm text-custom-peach">{item.celebrityType}</span>
              </div>
              
              <h2 className="text-lg font-medium mb-2">{item.fragranceName}</h2>
              
              {item.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
              )}
              
              <div className="flex justify-center items-center">
                <span className="text-lg font-bold">¥{item.price?.toLocaleString()}</span>
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