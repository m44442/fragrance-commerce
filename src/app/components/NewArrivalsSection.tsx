// src/app/components/NewArrivalsSection.tsx
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { getNewArrivals } from "@/lib/microcms/client";
import { productType } from "@/types/types";

const NewArrivalsSection = () => {
  const [newProducts, setNewProducts] = useState<productType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const result = await getNewArrivals();
        setNewProducts(result.contents || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch new arrivals:", error);
        setIsLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">新着商品</h2>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">新着商品</h2>
        <Link href="/new-arrivals" className="text-custom-peach text-sm font-medium hover:text-custom-peach-dark transition-colors flex items-center">
          もっと見る
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 lg:gap-6">
        {newProducts.slice(0, 6).map((product: productType) => (
          <Link key={product.id} href={`/products/${product.id}`} className="bg-white rounded-lg shadow overflow-hidden block hover:shadow-lg transition-shadow">
            <div className="relative aspect-square">
              {product.thumbnail?.url ? (
                <Image 
                  src={product.thumbnail.url} 
                  alt={product.title} 
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  No Image
                </div>
              )}
              
              {/* 新着バッジ */}
              <div className="absolute top-1 left-1 bg-red-500 text-white px-1.5 py-0.5 rounded-full flex items-center text-xs">
                <Star className="w-3 h-3 mr-0.5" />
                <span className="font-medium">NEW</span>
              </div>
              
              {/* お気に入りボタン */}
              <button className="absolute top-1 right-1 w-6 h-6 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                <Heart className="w-3 h-3 text-gray-500 hover:text-red-500" />
              </button>
            </div>
            
            <div className="p-1.5 md:p-3">
              <p className="text-xs text-gray-500 truncate mb-1">{product.brand}</p>
              <h2 className="text-xs font-medium mb-1 line-clamp-2 leading-tight">{product.title}</h2>
              <div className="text-xs font-bold text-custom-peach">
                ¥{product.price?.toLocaleString()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NewArrivalsSection;