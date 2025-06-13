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
        
        // カテゴリごとに商品を分類
        const categorizedProducts: {[key: string]: productType[]} = {};
        
        categories.forEach(category => {
          categorizedProducts[category.id] = products
            .filter((product: any) => {
              const productCategory = product.category || "";
              return productCategory.toLowerCase().includes(category.id.toLowerCase());
            })
            .slice(0, 6); // 各カテゴリ6商品（横3×縦2列）
        });
        
        setProductsByCategory(categorizedProducts);
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

      {categories.map((category) => {
        const products = productsByCategory[category.id] || [];
        
        if (products.length === 0) return null;

        return (
          <div key={category.id} className="mb-8">
            {/* カテゴリヘッダー */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
              <Link 
                href={`/categories/${category.id}`}
                className="flex items-center text-custom-peach hover:text-custom-peach-dark transition-colors"
              >
                <span className="text-sm font-medium">もっと見る</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* 商品グリッド: 横3×縦2列 (スマホ・タブレット共通) */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* 商品画像 */}
                  <div className="aspect-square bg-gray-200 relative">
                    {product.thumbnail?.url ? (
                      <Image 
                        src={product.thumbnail.url} 
                        alt={product.title} 
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 33vw, 16vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                    {product.isNew && (
                      <div className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        NEW
                      </div>
                    )}
                  </div>
                  
                  {/* 商品情報 */}
                  <div className="p-2">
                    <p className="text-xs text-gray-500 truncate mb-1">{product.brand}</p>
                    <h4 className="text-xs sm:text-sm font-medium line-clamp-2 mb-1 leading-tight">
                      {product.title}
                    </h4>
                    <p className="text-sm font-semibold text-custom-peach">
                      ¥{product.price?.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CategoryProductGrid;