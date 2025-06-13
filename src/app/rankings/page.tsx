// src/app/rankings/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Filter, ChevronDown, Star, Calendar } from "lucide-react";
import { client } from "@/lib/microcms/client";
import { productType } from "@/types/types";

// ランキングタイプの定義
const rankingTypes = [
  { id: "popular", label: "人気ランキング" },
  { id: "new-trend", label: "新着トレンド" },
  { id: "best-value", label: "コスパ最強" },
  { id: "gift", label: "ギフトにおすすめ" },
  { id: "office", label: "オフィス向け" },
  { id: "date", label: "デート向け" },
  { id: "seasonal", label: "季節のおすすめ" },
];

// ランキングタイプ説明
const rankingDescriptions = {
  popular: "最もご購入いただいている人気の商品をランキング形式でご紹介します。",
  "new-trend": "最近注目を集めている新しいトレンド商品をランキングでご紹介します。",
  "best-value": "コストパフォーマンスに優れたおすすめ商品を厳選しました。",
  gift: "大切な方へのプレゼントにぴったりな商品をランキングでご紹介します。",
  office: "オフィスでも使いやすい、控えめながら印象的な香りをランキングでご紹介します。",
  date: "デートシーンでおすすめの魅力的な香りをランキングでご紹介します。",
  seasonal: "現在の季節にぴったりのおすすめ香水をランキングでご紹介します。",
};

const RankingsPage = () => {
  const [products, setProducts] = useState<productType[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<productType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("popular");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("all"); // 'all', 'weekly', 'monthly'

  // 商品データの取得
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        
        // シンプルに全商品を取得してクライアントサイドでソート・フィルタリング
        const result = await client.getList({
          endpoint: 'rumini',
          queries: {
            limit: 100 // 十分な数を取得
          }
        });
        
        let fetchedProducts = result.contents || [];
        console.log('取得した商品数:', fetchedProducts.length);
        console.log('選択されたタイプ:', selectedType);
        
        // 選択されたランキングタイプに基づいてクライアントサイドでフィルタリング・ソート
        switch (selectedType) {
          case 'popular':
            // 人気ランキング - 全商品をレビュー数順でソート（フィルタリングなし）
            fetchedProducts = fetchedProducts
              .sort((a, b) => {
                // まずrankがあるものを優先
                if (a.rank && b.rank) return a.rank - b.rank;
                if (a.rank && !b.rank) return -1;
                if (!a.rank && b.rank) return 1;
                // rankがない場合はレビュー数順
                return (b.reviewCount || 0) - (a.reviewCount || 0);
              });
            break;
          case 'new-trend':
            // 新着トレンド - 公開日順
            fetchedProducts = fetchedProducts
              .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
            break;
          case 'best-value':
            // コスパ最強 - 価格が安い順（フィルタリングを緩く）
            fetchedProducts = fetchedProducts
              .filter(product => product.price && product.price < 8000) // 条件を緩く
              .sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
          case 'gift':
            // ギフト向け - 評価順（フィルタリングを緩く）
            fetchedProducts = fetchedProducts
              .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
            break;
          case 'office':
            // オフィス向け - まずはすべて表示してソート
            fetchedProducts = fetchedProducts
              .sort((a, b) => {
                // オフィス関連のキーワードがあるものを優先
                const aOffice = (a.category?.includes('オフィス') || a.title?.includes('ライト') || a.concentration === 'EDT') ? 1 : 0;
                const bOffice = (b.category?.includes('オフィス') || b.title?.includes('ライト') || b.concentration === 'EDT') ? 1 : 0;
                return bOffice - aOffice;
              });
            break;
          case 'date':
            // デート向け - まずはすべて表示してソート
            fetchedProducts = fetchedProducts
              .sort((a, b) => {
                const aDate = (a.category?.includes('デート') || a.title?.includes('セクシー') || a.concentration === 'EDP') ? 1 : 0;
                const bDate = (b.category?.includes('デート') || b.title?.includes('セクシー') || b.concentration === 'EDP') ? 1 : 0;
                return bDate - aDate;
              });
            break;
          case 'seasonal':
            // 季節のおすすめ - まずはすべて表示
            fetchedProducts = fetchedProducts
              .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
            break;
          default:
            // デフォルトは人気ランキング
            fetchedProducts = fetchedProducts
              .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        }
        
        console.log('フィルタリング後の商品数:', fetchedProducts.length);
        
        // フィルタリング・ソート済みの商品を保存
        setProducts(fetchedProducts);
        
        // 初期フィルタリングを適用
        applyTimeRangeFilter(fetchedProducts, timeRange);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch rankings:", error);
        setIsLoading(false);
        // エラー時は空の配列を設定
        setProducts([]);
        setFilteredProducts([]);
      }
    };

    fetchProducts();
  }, [selectedType]); // 選択されたタイプが変わったら再取得

  // 時間範囲でのフィルタリング
  const applyTimeRangeFilter = (products: productType[], range: string) => {
    if (range === 'all') {
      // すべての期間 - フィルタリングなし
      setFilteredProducts(products);
      return;
    }
    
    const now = new Date();
    let cutoffDate: Date;
    
    if (range === 'weekly') {
      // 週間 - 過去7日間
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'monthly') {
      // 月間 - 過去30日間
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      // 不明な範囲 - すべて表示
      setFilteredProducts(products);
      return;
    }
    
    // 期間でフィルタリング (publishedAtが指定期間内)
    const filtered = products.filter(product => {
      if (!product.publishedAt) return false;
      const publishDate = new Date(product.publishedAt);
      return publishDate >= cutoffDate;
    });
    
    // フィルタリング結果が少なすぎる場合はすべて表示
    if (filtered.length < 3) {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(filtered);
    }
  };
  
  // 時間範囲が変更されたら再フィルタリング
  useEffect(() => {
    applyTimeRangeFilter(products, timeRange);
  }, [timeRange, products]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ヘッダー部分 */}
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">ランキング</h1>
      </div>

      {/* フィルターコントロール */}
      <div className="mb-6">
        {/* ランキングタイプ選択ドロップダウン */}
        <div className="relative mb-4">
          <button
            className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm"
            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
          >
            <span className="font-medium">
              {rankingTypes.find(type => type.id === selectedType)?.label || "ランキングタイプ"}
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isTypeDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
              {rankingTypes.map(type => (
                <button
                  key={type.id}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    selectedType === type.id ? 'bg-gray-100 font-medium' : ''
                  }`}
                  onClick={() => {
                    setSelectedType(type.id);
                    setIsTypeDropdownOpen(false);
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 期間フィルター */}
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange("all")}
            className={`flex items-center px-4 py-2 rounded-full ${
              timeRange === "all"
                ? "bg-custom-peach text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <Filter className="w-4 h-4 mr-1" />
            すべて
          </button>
          <button
            onClick={() => setTimeRange("weekly")}
            className={`flex items-center px-4 py-2 rounded-full ${
              timeRange === "weekly"
                ? "bg-custom-peach text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <Calendar className="w-4 h-4 mr-1" />
            週間
          </button>
          <button
            onClick={() => setTimeRange("monthly")}
            className={`flex items-center px-4 py-2 rounded-full ${
              timeRange === "monthly"
                ? "bg-custom-peach text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <Calendar className="w-4 h-4 mr-1" />
            月間
          </button>
        </div>
      </div>

      {/* ランキング説明 */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-2">
          {rankingTypes.find(type => type.id === selectedType)?.label || "ランキング"}
        </h2>
        <p className="text-sm text-gray-600">
          {rankingDescriptions[selectedType as keyof typeof rankingDescriptions] || 
           "選ばれた商品をランキング形式でご紹介します。"}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-custom-peach rounded-full border-t-transparent"></div>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="space-y-6">
          {filteredProducts.slice(0, 10).map((product, index) => (
            <Link 
              key={product.id} 
              href={`/products/${product.id}`}
              className="flex bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow"
            >
              {/* ランキング順位表示 */}
              <div className="w-12 flex-shrink-0 flex items-center justify-center bg-gray-100">
                <div className={`text-xl font-bold ${
                  index === 0 ? 'text-yellow-500' : 
                  index === 1 ? 'text-gray-500' : 
                  index === 2 ? 'text-amber-700' : 'text-gray-700'
                }`}>
                  {index + 1}
                </div>
              </div>
              
              {/* 商品画像 */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 relative flex-shrink-0">
                {product.thumbnail?.url ? (
                  <Image 
                    src={product.thumbnail.url} 
                    alt={product.title} 
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              
              {/* 商品情報 */}
              <div className="p-3 flex-grow flex flex-col justify-between">
                <div>
                  <p className="text-xs text-gray-500">{product.brand}</p>
                  <h3 className="text-md font-medium">{product.title}</h3>
                  {product.category && (
                    <p className="text-xs text-pink-500 mt-1">
                      {Array.isArray(product.category) 
                        ? product.category.join(', ') 
                        : product.category}
                    </p>
                  )}
                </div>
                
                <div className="flex justify-between items-end mt-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm ml-1">
                      {product.averageRating?.toFixed(1) || "4.5"}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({product.reviewCount || 0})
                    </span>
                  </div>
                  <p className="text-sm font-semibold">¥{product.price?.toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">表示する商品がありません</p>
        </div>
      )}
    </div>
  );
};

export default RankingsPage;