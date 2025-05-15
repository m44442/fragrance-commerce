// src/app/brands/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { getFeaturedBrands } from "@/lib/microcms/client";
import { ArrowLeft, Search } from "lucide-react";

// ブランドの型定義
interface Brand {
  id: string;
  name: string;
  nameJp: string;
  description?: string;
  logoUrl?: string;
  imageUrl?: string;
  tagline?: string;
  isFeatured?: boolean;
}

const BrandsPage = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [displayBrands, setDisplayBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'featured'
  const { data: session } = useSession();

  // ブランドデータ取得
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const result = await getFeaturedBrands();
        
        // MicroCMSからのデータを整形
        const formattedBrands: Brand[] = (result.contents || []).map(brand => ({
          id: brand.id,
          name: brand.name,
          nameJp: brand.nameJp || '',
          description: brand.description || '',
          logoUrl: brand.logoUrl,
          imageUrl: brand.imageUrl || brand.thumbnail?.url,
          tagline: brand.tagline || '',
          isFeatured: brand.isFeatured || false
        }));
        
        setBrands(formattedBrands);
        setDisplayBrands(formattedBrands);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch brands:", error);
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  // 検索とフィルタリング
  useEffect(() => {
    let filtered = [...brands];
    
    // フィルター適用
    if (filter === "featured") {
      filtered = filtered.filter(brand => brand.isFeatured);
    }
    
    // 検索用語による絞り込み
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        brand => 
          brand.name.toLowerCase().includes(term) || 
          (brand.nameJp && brand.nameJp.toLowerCase().includes(term))
      );
    }
    
    setDisplayBrands(filtered);
  }, [searchTerm, filter, brands]);

  // アルファベット順にソート
  const sortedBrands = [...displayBrands].sort((a, b) => a.name.localeCompare(b.name));

  // アルファベット別にグループ化
  const groupedBrands = sortedBrands.reduce((acc, brand) => {
    const firstLetter = brand.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(brand);
    return acc;
  }, {} as Record<string, Brand[]>);

  // アルファベット順に並べた文字配列
  const letters = Object.keys(groupedBrands).sort();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ヘッダー部分 */}
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">ブランド一覧</h1>
      </div>

      {/* 検索とフィルターコントロール */}
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

        <div className="flex space-x-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full ${
              filter === "all"
                ? "bg-custom-peach text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setFilter("featured")}
            className={`px-4 py-2 rounded-full ${
              filter === "featured"
                ? "bg-custom-peach text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            注目のブランド
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-custom-peach rounded-full border-t-transparent"></div>
        </div>
      ) : displayBrands.length > 0 ? (
        <div>
          {/* アルファベットインデックス */}
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

          {/* ブランドリスト */}
          {letters.map(letter => (
            <div key={letter} id={letter} className="mb-8">
              <h2 className="text-xl font-bold mb-4 sticky top-16 bg-white py-2 border-b">{letter}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedBrands[letter].map(brand => (
                  <Link 
                    key={brand.id} 
                    href={`/brands/${brand.id}`}
                    className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow"
                  >
                    <div className="h-40 bg-gray-200 relative">
                      {brand.imageUrl ? (
                        <Image 
                          src={brand.imageUrl} 
                          alt={brand.name} 
                          layout="fill" 
                          objectFit="cover"
                        />
                      ) : brand.logoUrl ? (
                        <div className="flex items-center justify-center h-full bg-white p-4">
                          <Image 
                            src={brand.logoUrl} 
                            alt={brand.name} 
                            width={150}
                            height={100}
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          {brand.name}
                        </div>
                      )}
                      {brand.isFeatured && (
                        <div className="absolute top-2 right-2 bg-custom-peach text-white text-xs px-2 py-1 rounded-full">
                          注目
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-md font-bold">{brand.name}</h3>
                      {brand.nameJp && (
                        <p className="text-sm text-gray-600">{brand.nameJp}</p>
                      )}
                      {brand.tagline && (
                        <div className="mt-2 bg-gray-100 rounded-full px-3 py-1">
                          <p className="text-xs text-gray-700">{brand.tagline}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">検索条件に一致するブランドがありません</p>
        </div>
      )}
    </div>
  );
};

export default BrandsPage;