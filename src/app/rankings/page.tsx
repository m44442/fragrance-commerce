// src/app/rankings/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Filter, ChevronDown, Star, Calendar } from "lucide-react";
import { getAllProducts, client } from "@/lib/microcms/client";
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

const RankingsPage = () => {
  const [products, setProducts] = useState<productType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("popular");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("all"); // 'all', 'weekly', 'monthly'

  // 商品データの取得
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // 選択されたランキングタイプに基づいてエンドポイントを決定
        let endpoint = 'rumini'; // デフォルト
        let additionalQuery = {};
        
        if (selectedType === 'popular') {
          // 人気ランキング - 評価や購入数などの情報を含む商品を取得
          endpoint = 'rumini_ranking';
          additionalQuery = { 
            orders: '-reviewCount',
            limit: 20
          };
        } else if (selectedType === 'new-trend') {
          // 新着トレンド - 新しくて注目されている商品
          endpoint = 'new_arrivals';
          additionalQuery = { 
            limit: 10
          };
        } else if (selectedType === 'best-value') {
          // コスパ最強 - 価格帯が手頃な商品
          endpoint = 'rumini';
          additionalQuery = {
            filters: 'price[less_than]5000',
            orders: 'price',
            limit: 10
          };
        } else {
          // その他のタイプ (gift, office, date, seasonal)
          // カテゴリやシーン情報に基づいてフィルタリング
          endpoint = 'rumini';
          additionalQuery = {
            filters: `category[contains]${selectedType}`,
            limit: 10
          };
        }
        
        // MicroCMSから該当ランキングの商品を取得
        const result = await client.getList({
          endpoint: endpoint,
          queries: {
            ...additionalQuery
          }
        });
        
        // データが足りない場合は通常の商品から補完
        let rankingProducts = result.contents || [];
        
        if (rankingProducts.length < 5) {
          const defaultResult = await getAllProducts();
          // デフォルト商品をランダムにソートして追加
          const additionalProducts = defaultResult.contents
            .filter(p => !rankingProducts.some(rp => rp.id === p.id))
            .sort(() => 0.5 - Math.random())
            .slice(0, 10 - rankingProducts.length);
            
          rankingProducts = [...rankingProducts, ...additionalProducts];
        }
        
        // ランキング順に並べ替え
        // または適切なソート基準に基づいてソート
        if (selectedType === 'popular') {
          rankingProducts.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        } else if (selectedType === 'best-value') {
          rankingProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
        }
        
        setProducts(rankingProducts);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch rankings:", error);
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [selectedType]);

  // 選択されたタイプに基づいてフィルタリング
  // 実際のアプリケーションでは、各タイプに対して適切なフィルタリングロジックを実装します
  const filterProductsByType = (products: productType[]) => {
    // この例では、タイプに基づいたフィルタリングロジックのモックを返します
    return products.filter(product => {
      // 実際のアプリケーションでは、各タイプに応じて異なるフィルター条件を適用します
      if (selectedType === "popular") return true; // 人気ランキングはすべての商品を表示
      if (selectedType === "best-value" && product.price < 5000) return true; // コスパ最強は5000円以下
      if (selectedType === "new-trend" && product.isNew) return true; // 新着トレンドは新商品のみ
      if (selectedType === "gift" && product.category === "ギフト") return true;
      if (selectedType === "office" && product.category === "オフィス") return true;
      if (selectedType === "date" && product.category === "デート") return true;
      if (selectedType === "seasonal" && product.category === "季節") return true;
      
      // デモ用に一部の商品を表示（実際の実装では適切なフィルタリングロジックに置き換えます）
      return Math.random() > 0.5;
    }).slice(0, 10); // 上位10アイテムを表示
  };
  
  const filteredProducts = filterProductsByType(products);

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
          {selectedType === "popular" && "最もご購入いただいている人気の商品をランキング形式でご紹介します。"}
          {selectedType === "new-trend" && "最近注目を集めている新しいトレンド商品をランキングでご紹介します。"}
          {selectedType === "best-value" && "コストパフォーマンスに優れたおすすめ商品を厳選しました。"}
          {selectedType === "gift" && "大切な方へのプレゼントにぴったりな商品をランキングでご紹介します。"}
          {selectedType === "office" && "オフィスでも使いやすい、控えめながら印象的な香りをランキングでご紹介します。"}
          {selectedType === "date" && "デートシーンでおすすめの魅力的な香りをランキングでご紹介します。"}
          {selectedType === "seasonal" && "現在の季節にぴったりのおすすめ香水をランキングでご紹介します。"}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-custom-peach rounded-full border-t-transparent"></div>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="space-y-6">
          {filteredProducts.map((product, index) => (
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
                    layout="fill" 
                    objectFit="cover"
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
                    <p className="text-xs text-pink-500 mt-1">{product.category}</p>
                  )}
                </div>
                
                <div className="flex justify-between items-end mt-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm ml-1">
                      {product.averageRating?.toFixed(1) || "4.5"}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({product.reviewCount || 10})
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