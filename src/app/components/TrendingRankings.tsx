"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { getAllProducts } from "@/lib/microcms/client";
import { productType } from "@/types/types";

const TrendingRankings = () => {
  const [contents, setContents] = useState<productType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { contents: fetchedContents } = await getAllProducts();
        console.log(fetchedContents);
        setContents(fetchedContents);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const sortedContents = contents.sort((a: productType, b: productType) => (a.rank || 0) - (b.rank || 0));

  if (loading) {
    return (
      <div className="px-4 py-6 bg-gray-50 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">人気のアイテム</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 bg-gray-50 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">人気のアイテム</h2>
        <Link href="/rankings" className="text-custom-peach text-sm font-medium hover:text-custom-peach-dark transition-colors flex items-center">
          もっと見る
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        この1週間でアクセス数が急増したアイテムをご紹介します。
      </p>
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 lg:gap-6">
          {sortedContents.slice(0, 6).map((contents: productType) => (
            <Link key={contents.id} href={`/products/${contents.id}`} className="bg-white rounded-lg shadow overflow-hidden block hover:shadow-lg transition-shadow">
              <div className="relative aspect-square">
                {contents.thumbnail?.url ? (
                  <Image 
                    src={contents.thumbnail.url} 
                    alt={contents.title} 
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    No Image
                  </div>
                )}
                
                {/* ランキングバッジ */}
                <div className="absolute top-1 left-1 bg-yellow-500 text-white px-1.5 py-0.5 rounded-full flex items-center text-xs">
                  <Star className="w-3 h-3 mr-0.5" />
                  <span className="font-medium">#{contents.rank}</span>
                </div>
                
                {/* お気に入りボタン */}
                <button className="absolute top-1 right-1 w-6 h-6 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                  <Heart className="w-3 h-3 text-gray-500 hover:text-red-500" />
                </button>
              </div>
              
              <div className="p-1.5 md:p-3">
                <p className="text-xs text-gray-500 truncate mb-1">{contents.brand}</p>
                <h2 className="text-xs font-medium mb-1 line-clamp-2 leading-tight">{contents.title}</h2>
                <div className="text-xs font-bold text-custom-peach">
                  ¥{contents.price.toLocaleString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
    </div>
  );
};

export default TrendingRankings;