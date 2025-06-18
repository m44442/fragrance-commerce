// src/app/search/page.tsx
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search as SearchIcon, Filter } from "lucide-react";

// 検索フィルターの型定義
interface SearchFilters {
  category: string[];
  brand: string[];
  priceRange: {
    min: number | null;
    max: number | null;
  };
}

// 検索結果アイテムの型定義
interface SearchResult {
  id: string;
  title: string;
  brand: string;
  price: number;
  category: string;
  thumbnail: { url: string };
}

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: [],
    brand: [],
    priceRange: {
      min: null,
      max: null,
    },
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  
  // カテゴリとブランドの取得
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch("/api/search/filters");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
          setBrands(data.brands || []);
        }
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };
    
    fetchFilters();
  }, []);
  
  // 検索処理
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      // 検索クエリが存在する場合は追加
      if (searchQuery.trim()) {
        queryParams.append("q", searchQuery.trim());
      }
      
      // フィルターの追加
      filters.category.forEach(cat => queryParams.append("category", cat));
      filters.brand.forEach(brand => queryParams.append("brand", brand));
      
      if (filters.priceRange.min !== null) {
        queryParams.append("minPrice", filters.priceRange.min.toString());
      }
      
      if (filters.priceRange.max !== null) {
        queryParams.append("maxPrice", filters.priceRange.max.toString());
      }
      
      const response = await fetch(`/api/search?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.products || []);
      }
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // フォーム送信ハンドラー
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };
  
  // フィルターの更新
  const handleCategoryChange = (category: string) => {
    setFilters(prev => {
      const newCategories = prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category];
      
      return {
        ...prev,
        category: newCategories
      };
    });
  };
  
  const handleBrandChange = (brand: string) => {
    setFilters(prev => {
      const newBrands = prev.brand.includes(brand)
        ? prev.brand.filter(b => b !== brand)
        : [...prev.brand, brand];
      
      return {
        ...prev,
        brand: newBrands
      };
    });
  };
  
  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseInt(value) : null;
    
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [type]: numValue
      }
    }));
  };
  
  // フィルターリセット
  const resetFilters = () => {
    setFilters({
      category: [],
      brand: [],
      priceRange: {
        min: null,
        max: null,
      },
    });
    setSearchQuery("");
  };

  // 初期ロード時に一度検索を実行
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">商品検索</h1>
      
      {/* 検索バー */}
      <div className="mb-6">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="香水名、ブランド名、香りなどを入力"
              className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-purple-600"
            >
              <SearchIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
      
      {/* フィルターとグリッドのレイアウト */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* フィルターセクション (モバイルでは折りたたみ可能) */}
        <div className="w-full md:w-64">
          <div className="flex justify-between items-center md:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-gray-700 font-medium"
            >
              <Filter className="w-5 h-5 mr-2" />
              フィルター
              <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {filters.category.length + filters.brand.length + (filters.priceRange.min !== null ? 1 : 0) + (filters.priceRange.max !== null ? 1 : 0)}
              </span>
            </button>
            
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              リセット
            </button>
          </div>
          
          <div className={`bg-white rounded-lg shadow overflow-hidden mb-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <div className="p-4 border-b">
              <h2 className="font-semibold">香りの系統</h2>
              <div className="mt-2 space-y-2">
                {categories.map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.category.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                      className="rounded text-purple-500 focus:ring-purple-400 mr-2"
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-b">
              <h2 className="font-semibold">ブランド</h2>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {brands.map(brand => (
                  <label key={brand} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.brand.includes(brand)}
                      onChange={() => handleBrandChange(brand)}
                      className="rounded text-purple-500 focus:ring-purple-400 mr-2"
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="p-4">
              <h2 className="font-semibold mb-2">価格帯</h2>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="¥ 下限"
                  value={filters.priceRange.min ?? ''}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 text-sm"
                  min={0}
                />
                <span>〜</span>
                <input
                  type="number"
                  placeholder="¥ 上限"
                  value={filters.priceRange.max ?? ''}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 text-sm"
                  min={0}
                />
              </div>
            </div>
            
            <div className="p-4 bg-gray-50">
              <button
                onClick={handleSearch}
                className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
              >
                検索結果を更新
              </button>
            </div>
          </div>
        </div>
        
        {/* 検索結果グリッド */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-10 w-10 border-4 border-purple-500 rounded-full border-t-transparent"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div>
              <p className="mb-4 text-gray-500">{searchResults.length}件の商品が見つかりました</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchResults.map(product => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow transition"
                  >
                    <div className="h-40 bg-gray-100 relative">
                      {product.thumbnail?.url ? (
                        <Image
                          src={product.thumbnail.url}
                          alt={product.title}
                          layout="fill"
                          objectFit="cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3">
                      <p className="text-xs text-gray-500">{product.brand}</p>
                      <h3 className="text-sm font-medium truncate">{product.title}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-pink-500">{product.category}</p>
                        <p className="text-xs font-semibold">¥{product.price?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500 mb-2">検索結果がありません</p>
              <p className="text-sm text-gray-400">別のキーワードやフィルターで試してみてください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;