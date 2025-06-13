// src/app/components/CategoryProductGrid.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { getAllProducts } from "@/lib/microcms/client";
import { productType } from "@/types/types";

// カテゴリ定義
const categories = [
  { id: "floral", name: "フローラル", description: "花の香りが特徴的な香水" },
  { id: "citrus", name: "シトラス", description: "爽やかな柑橘系の香り" },
  { id: "woody", name: "ウッディ", description: "木の温かみのある香り" },
  { id: "oriental", name: "オリエンタル", description: "エキゾチックで深みのある香り" },
  { id: "fresh", name: "フレッシュ", description: "清潔感のある爽やかな香り" },
  { id: "gourmand", name: "グルマン", description: "甘い食べ物のような香り" }
];

const CategoryProductGrid = () => {
  const [productsByCategory, setProductsByCategory] = useState<{[key: string]: productType[]}>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const result = await getAllProducts();
        const products = result.contents || [];
        
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <div className="px-4 py-8 max-w-7xl mx-auto">
        <div className="flex justify-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-custom-peach rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center mb-2">カテゴリ別おすすめ商品</h2>
        <p className="text-gray-600 text-center">お好みの香りのタイプから選んでみてください</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 lg:gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.id}`}
            className="block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* カテゴリ画像 */}
            <div className="aspect-square bg-gradient-to-br from-custom-peach/20 to-custom-peach/40 relative flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {category.id === 'floral' && '🌸'}
                  {category.id === 'citrus' && '🍊'}
                  {category.id === 'woody' && '🌳'}
                  {category.id === 'oriental' && '🏛️'}
                  {category.id === 'fresh' && '💧'}
                  {category.id === 'gourmand' && '🍰'}
                </div>
                <h3 className="text-xs font-bold text-gray-800">{category.name}</h3>
              </div>
            </div>
            
            {/* カテゴリ情報 */}
            <div className="p-1.5 md:p-3">
              <p className="text-xs text-gray-600 line-clamp-2 leading-tight">
                {category.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryProductGrid;