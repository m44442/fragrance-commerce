// src/app/brands/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { getProductsByBrand } from "@/lib/microcms/client";
import { ArrowLeft, Search, Star } from "lucide-react";
import { productType } from "@/types/types";

// ブランドと商品のグループを表す型
interface BrandWithProducts {
  id: string;
  name: string;
  products: productType[];
}

const BrandsPage = () => {
  const [brandGroups, setBrandGroups] = useState<BrandWithProducts[]>([]);
  const [displayBrandGroups, setDisplayBrandGroups] = useState<BrandWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: session } = useSession();

  // ブランドごとの商品データを取得
  useEffect(() => {
    const fetchBrandProducts = async () => {
      try {
        const result = await getProductsByBrand();
        setBrandGroups(result);
        setDisplayBrandGroups(result);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch brand products:", error);
        setLoading(false);
      }
    };

    fetchBrandProducts();
  }, []);

  // 検索フィルタリング
  useEffect(() => {
    if (!searchTerm) {
      setDisplayBrandGroups(brandGroups);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    
    // ブランド名で検索
    const filteredBrands = brandGroups.filter(group => 
      group.name.toLowerCase().includes(term)
    );
    
    setDisplayBrandGroups(filteredBrands);
  }, [searchTerm, brandGroups]);

  // アルファベット別にグループ化
  const groupByAlphabet = displayBrandGroups.reduce((acc, brand) => {
    const firstLetter = brand.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(brand);
    return acc;
  }, {} as Record<string, BrandWithProducts[]>);

  // アルファベット順に文字を取得
  const letters = Object.keys(groupByAlphabet).sort();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ヘッダー部分 */}
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">ブランド別商品一覧</h1>
      </div>

      {/* 検索 */}
      <div className="mb-6">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="ブランド名を検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-custom-peach"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-custom-peach rounded-full border-t-transparent"></div>
        </div>
      ) : displayBrandGroups.length > 0 ? (
        <div>
          {/* アルファベットインデックス */}
          {letters.length > 1 && (
            <div className="flex flex-wrap justify-center mb-6 gap-2">
              {letters.map(letter => (
                <a 
                  key={letter} 
                  href={`#${letter}`} 
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-custom-peach hover:text-white rounded-full text-sm"
                >
                  {letter}
                </a>
              ))}
            </div>
          )}

          {/* ブランドごとの商品リスト */}
          {letters.map(letter => (
            <div key={letter} id={letter} className="mb-12">
              <h2 className="text-xl font-bold mb-4 sticky top-16 bg-white py-2 border-b">{letter}</h2>
              
              {groupByAlphabet[letter].map(brandGroup => (
                <div key={brandGroup.id} className="mb-8">
                  {/* ブランドヘッダー */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">{brandGroup.name}</h3>
                    <Link href={`/brands/${brandGroup.id}`} className="text-sm text-gray-500 hover:text-custom-peach">
                      もっと見る &gt;
                    </Link>
                  </div>
                  
                  {/* 商品リスト - 横スクロール */}
                  <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
                    {brandGroup.products.map(product => (
                      <Link 
                        key={product.id} 
                        href={`/products/${product.id}`}
                        className="flex-shrink-0 w-56 bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow"
                      >
                        {/* 商品画像 */}
                        <div className="h-40 bg-gray-200 relative">
                          {product.thumbnail?.url ? (
                            <Image 
                              src={product.thumbnail.url} 
                              alt={product.title} 
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                          {product.isNew && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                              NEW
                            </div>
                          )}
                        </div>
                        
                        {/* 商品情報 */}
                        <div className="p-3">
                          <p className="text-xs text-gray-500">{product.brand}</p>
                          <h4 className="text-sm font-medium truncate">{product.title}</h4>
                          
                          {/* 評価表示 */}
                          {product.averageRating && (
                            <div className="flex items-center mt-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span className="text-xs ml-1">{product.averageRating.toFixed(1)}</span>
                              {product.reviewCount && (
                                <span className="text-xs text-gray-500 ml-1">({product.reviewCount})</span>
                              )}
                            </div>
                          )}
                          
                          <p className="text-sm font-semibold mt-1">¥{product.price?.toLocaleString()}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">ブランドが見つかりません</p>
        </div>
      )}
    </div>
  );
};

export default BrandsPage;