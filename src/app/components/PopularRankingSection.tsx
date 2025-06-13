import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { getAllProducts } from "@/lib/microcms/client";
import { productType } from "@/types/types";

const PopularRankingSection = async () => {

  const { contents } = await getAllProducts();
  console.log(contents);

  return (
    <div className="px-4 py-6 bg-gray-50 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">セレクトアイテム</h2>
        <Link href="/select-items" className="text-custom-peach text-sm font-medium hover:text-custom-peach-dark transition-colors flex items-center">
          もっと見る
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-4">
      シーン別や香り別など、多彩なテーマごとにアイテムをセレクトしています。
      </p>
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 lg:gap-6">
          {contents.slice(0, 6).map((contents: productType) => (
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
                
                {/* セレクトバッジ */}
                <div className="absolute top-1 left-1 bg-custom-peach text-white px-1.5 py-0.5 rounded-full flex items-center text-xs">
                  <Star className="w-3 h-3 mr-0.5" />
                  <span className="font-medium">SELECT</span>
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

export default PopularRankingSection;