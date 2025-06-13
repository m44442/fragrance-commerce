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
        setBrands((result.contents as any) || []);
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
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 lg:gap-6">
          {brands.slice(0, 6).map((brand) => (
            <Link 
              key={brand.id} 
              href={`/brands/${brand.id}`}
              className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-gray-200 relative">
                {brand.imageUrl ? (
                  <Image 
                    src={brand.imageUrl} 
                    alt={brand.name} 
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    {brand.name}
                  </div>
                )}
              </div>
              <div className="p-1.5 md:p-3">
                <h3 className="text-xs font-bold truncate">{brand.name}</h3>
                <p className="text-xs text-gray-600 truncate mb-1">{brand.nameJp}</p>
                <div className="bg-custom-peach bg-opacity-20 rounded-full px-2 py-0.5">
                  <p className="text-xs text-custom-peach font-medium truncate">{brand.tagline}</p>
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