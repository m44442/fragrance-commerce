// src/app/components/BrandSection.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getFeaturedBrands } from "@/lib/microcms/client";

// ブランドの型定義
interface Brand {
  id: string;
  name: string;
  nameJp: string;
  tagline: string;
  imageUrl: string;
}

const BrandSection = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // データ取得用の関数
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const result = await getFeaturedBrands();
        setBrands(result.contents || []);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch brands:", error);
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">厳選！注目のブランド特集</h2>
        <Link href="/brands" className="text-custom-peach text-sm font-medium hover:text-custom-peach-dark transition-colors flex items-center">
          もっと見る
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
          {brands.map((brand) => (
            <Link 
              key={brand.id} 
              href={`/brands/${brand.id}`}
              className="flex-shrink-0 w-60 bg-white rounded-lg overflow-hidden shadow"
            >
              <div className="h-32 bg-gray-200 relative">
                {brand.imageUrl ? (
                  <Image 
                    src={brand.imageUrl} 
                    alt={brand.name} 
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    {brand.name}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold">{brand.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{brand.nameJp}</p>
                <div className="bg-custom-peach bg-opacity-20 rounded-full px-3 py-1">
                  <p className="text-sm text-custom-peach font-medium">{brand.tagline}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrandSection;