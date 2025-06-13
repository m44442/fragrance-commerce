// src/app/categories/[categoryId]/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft, Filter, ChevronDown, Star } from "lucide-react";
import { getAllProducts, client } from "@/lib/microcms/client";
import { productType } from "@/types/types";

// カテゴリデータの型定義
interface CategoryData {
  id: string;
  name: string;
  description: string;
  bannerUrl?: string;
}

const CategoryDetailPage = () => {
  const params = useParams();
  const categoryId = params?.categoryId as string;
  const [products, setProducts] = useState<productType[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<productType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState("popularity"); // 'popularity', 'price-asc', 'price-desc', 'newest'
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [category, setCategory] = useState<CategoryData>({
    id: categoryId,
    name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
    description: "このカテゴリに該当する商品をご紹介します。"
  });

  // カテゴリデータと商品データの取得
  useEffect(() => {

const fetchCategoryData = async () => {
  try {
    setIsLoading(true);
    
    // categoriesエンドポイントが存在しないため、カテゴリIDからカテゴリ情報を生成
    const decodedCategoryId = decodeURIComponent(categoryId);
    setCategory({
      id: categoryId,
      name: decodedCategoryId,
      description: `${decodedCategoryId}の香水一覧`,
      bannerUrl: "/default_icon.png"
    });
    
    // カテゴリに関連する商品の取得
    let categoryProducts: productType[] = [];
    
    try {
      // カテゴリタイプの判定
      const categoryType = ["floral", "citrus", "woody", "oriental", "fresh", "gourmand", "green", "aquatic", "fruity", "spicy"].includes(categoryId) 
        ? 'scent' 
        : 'scene';
          
      // まずはカテゴリで商品を検索
      const productResult = await client.getList({
        endpoint: 'rumini',
        queries: {
          filters: `category[contains]${categoryId}`,
          limit: 100
        }
      });
      
      categoryProducts = productResult.contents || [];
      
      // カテゴリで商品が見つからない場合はシーン情報で検索
      if (productResult.contents.length === 0) {
        const sceneResult = await client.getList({
          endpoint: 'rumini',
          queries: {
            filters: `scenes[contains]${categoryId}`, // シーン情報の場合
            limit: 100
          }
        });
        categoryProducts = sceneResult.contents || [];
      }
      
      // 関連商品が見つからない場合は、より広いフィルタリングを試みる
      if (categoryProducts.length === 0) {
        // 商品名や説明文からキーワード検索
        const keywordResult = await client.getList({
          endpoint: 'rumini',
          queries: {
            q: category.name,
            limit: 100
          }
        });
        
        categoryProducts = keywordResult.contents || [];
      }
    } catch (productError) {
      console.error("Failed to fetch category products:", productError);
    }
    
    // それでも商品が見つからない場合は、全ての商品を取得して関連性のある商品をフィルタリング
    if (categoryProducts.length === 0) {
      try {
        const allProducts = await getAllProducts();
        categoryProducts = allProducts.contents.filter((product: any) => {
          const categoryName = category.name.toLowerCase();
          const productDesc = (product.description || '').toLowerCase();
          const productTitle = (product.title || '').toLowerCase();
          
          return productDesc.includes(categoryName) || 
                productTitle.includes(categoryName) ||
                (product.category && typeof product.category === 'string' && product.category.toLowerCase().includes(categoryName));
        });
        
        // それでも見つからない場合はランダムに8つ表示
        if (categoryProducts.length < 4) {
          categoryProducts = allProducts.contents
            .sort(() => 0.5 - Math.random())
            .slice(0, 8);
        }
      } catch (allProductsError) {
        console.error("Failed to fetch all products:", allProductsError);
      }
    }
    
    setProducts(categoryProducts || []);
    setFilteredProducts(categoryProducts || []);
    setIsLoading(false);
  } catch (error) {
    console.error("Failed to fetch category data:", error);
    setIsLoading(false);
  }
};

    fetchCategoryData();
  }, [categoryId]);

  // 商品のソートとフィルタリング
  useEffect(() => {
    let sorted = [...products];
    
    // ソート
    if (sortOption === "price-asc") {
      sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortOption === "price-desc") {
      sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortOption === "newest") {
      sorted.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      });
    } else { // popularity (default)
      sorted.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    }
    
    // 価格フィルタリング
    sorted = sorted.filter(
      product => (product.price || 0) >= priceRange[0] && (product.price || 0) <= priceRange[1]
    );
    
    setFilteredProducts(sorted);
  }, [products, sortOption, priceRange]);

  // 価格範囲の変更ハンドラ
  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange([min, max]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ヘッダー部分 */}
      <div className="flex items-center mb-6">
        <Link href="/categories" className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">{category.name}</h1>
      </div>

      {/* カテゴリ説明 */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">{category.description}</p>
      </div>

      {/* フィルターとソート */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setShowFilterModal(true)}
          className="flex items-center bg-gray-100 px-4 py-2 rounded-full"
        >
          <Filter className="w-4 h-4 mr-1" />
          フィルター
        </button>
        
        {/* ソートドロップダウン */}
        <div className="relative">
          <button
            className="flex items-center bg-gray-100 px-4 py-2 rounded-full"
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
          >
            <span>並び替え: </span>
            <span className="font-medium ml-1">
              {sortOption === "popularity" && "人気順"}
              {sortOption === "price-asc" && "価格が安い順"}
              {sortOption === "price-desc" && "価格が高い順"}
              {sortOption === "newest" && "新着順"}
            </span>
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isSortDropdownOpen && (
            <div className="absolute right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 w-40">
              <button
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${sortOption === "popularity" ? "font-medium" : ""}`}
                onClick={() => {
                  setSortOption("popularity");
                  setIsSortDropdownOpen(false);
                }}
              >
                人気順
              </button>
              <button
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${sortOption === "price-asc" ? "font-medium" : ""}`}
                onClick={() => {
                  setSortOption("price-asc");
                  setIsSortDropdownOpen(false);
                }}
              >
                価格が安い順
              </button>
              <button
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${sortOption === "price-desc" ? "font-medium" : ""}`}
                onClick={() => {
                  setSortOption("price-desc");
                  setIsSortDropdownOpen(false);
                }}
              >
                価格が高い順
              </button>
              <button
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${sortOption === "newest" ? "font-medium" : ""}`}
                onClick={() => {
                  setSortOption("newest");
                  setIsSortDropdownOpen(false);
                }}
              >
                新着順
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 商品数表示 */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">{filteredProducts.length}件の商品が見つかりました</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-custom-peach rounded-full border-t-transparent"></div>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow"
            >
                            {/* 商品画像 */}
              <div className="h-40 bg-gray-200 relative">
                {product.thumbnail?.url ? (
                  <Image 
                    src={product.thumbnail.url} 
                    alt={product.title} 
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                    priority={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
                {product.isNew && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                    NEW
                  </div>
                )}
              </div>
              
              {/* 商品情報 */}
              <div className="p-3">
                <p className="text-xs text-gray-500">{product.brand}</p>
                <h3 className="text-sm font-medium truncate">{product.title}</h3>
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
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">このカテゴリに該当する商品が見つかりませんでした</p>
        </div>
      )}

      {/* フィルターモーダル */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">フィルター</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* 価格範囲フィルター */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-2">価格帯</h4>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-500">¥{priceRange[0].toLocaleString()}</span>
                <span className="text-xs text-gray-500">¥{priceRange[1].toLocaleString()}</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full">
                <div
                  className="absolute h-full bg-custom-peach rounded-full"
                  style={{
                    left: `${(priceRange[0] / 50000) * 100}%`,
                    right: `${100 - (priceRange[1] / 50000) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between mt-4">
                <button
                  className={`px-3 py-1 text-xs rounded-full ${
                    priceRange[0] === 0 && priceRange[1] === 50000
                      ? "bg-custom-peach text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => handlePriceRangeChange(0, 50000)}
                >
                  すべて
                </button>
                <button
                  className={`px-3 py-1 text-xs rounded-full ${
                    priceRange[0] === 0 && priceRange[1] === 3000
                      ? "bg-custom-peach text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => handlePriceRangeChange(0, 3000)}
                >
                  〜¥3,000
                </button>
                <button
                  className={`px-3 py-1 text-xs rounded-full ${
                    priceRange[0] === 3000 && priceRange[1] === 10000
                      ? "bg-custom-peach text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => handlePriceRangeChange(3000, 10000)}
                >
                  ¥3,000〜¥10,000
                </button>
                <button
                  className={`px-3 py-1 text-xs rounded-full ${
                    priceRange[0] === 10000 && priceRange[1] === 50000
                      ? "bg-custom-peach text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => handlePriceRangeChange(10000, 50000)}
                >
                  ¥10,000〜
                </button>
              </div>
            </div>
            
            {/* ボタン */}
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setPriceRange([0, 50000]);
                  setShowFilterModal(false);
                }}
                className="flex-1 py-2 bg-gray-100 rounded-lg text-gray-700"
              >
                リセット
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 py-2 bg-custom-peach text-white rounded-lg"
              >
                適用する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDetailPage;