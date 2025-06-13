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

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {newProducts.slice(0, 6).map((product: productType) => (
          <Link key={product.id} href={`/products/${product.id}`} className="bg-white rounded-lg shadow overflow-hidden block hover:shadow-lg transition-shadow">
            <div className="relative h-64">
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
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center">
                <Star className="w-4 h-4 mr-1" />
                <span className="font-medium">NEW</span>
              </div>
              
              {/* お気に入りボタン */}
              <button className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-gray-500 hover:text-red-500" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">{product.brand}</span>
                <span className="text-sm text-red-500">新着</span>
              </div>
              
              <h2 className="text-lg font-medium mb-2">{product.title}</h2>
              
              <div className="flex justify-center items-center">
                <span className="text-lg font-bold">¥{product.price?.toLocaleString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NewArrivalsSection;