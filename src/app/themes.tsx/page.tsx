// src/app/themes/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Search, Heart, Calendar, Coffee, Wine, Briefcase, Music, Sun, Moon } from "lucide-react";
import { getUniqueThemes } from "@/lib/microcms/client"; // 新しい関数を使用

// テーマの型定義
interface Theme {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
  icon?: React.ReactNode;
}

const ThemesPage = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [displayThemes, setDisplayThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // テーマのアイコンマッピング
  const getThemeIcon = (themeId: string) => {
    const icons: Record<string, React.ReactNode> = {
      "date": <Heart className="w-4 h-4" />,
      "seasonal": <Calendar className="w-4 h-4" />,
      "coffee": <Coffee className="w-4 h-4" />,
      "wine": <Wine className="w-4 h-4" />,
      "office": <Briefcase className="w-4 h-4" />,
      "music": <Music className="w-4 h-4" />,
      "day": <Sun className="w-4 h-4" />,
      "night": <Moon className="w-4 h-4" />,
      "popular": <Heart className="w-4 h-4" />,
      "new-trend": <Calendar className="w-4 h-4" />,
      "best-value": <Heart className="w-4 h-4" />,
      "gift": <Calendar className="w-4 h-4" />,
    };
    
    // IDが直接マッチするか確認
    if (icons[themeId]) return icons[themeId];
    
    // 部分一致で探す
    for (const [key, icon] of Object.entries(icons)) {
      if (themeId.includes(key)) return icon;
    }
    
    // デフォルトアイコン
    return <Heart className="w-4 h-4" />;
  };

  // テーマカテゴリ
  const themeCategories = [
    { id: "all", name: "すべて" },
    { id: "popular", name: "人気" },
    { id: "seasonal", name: "季節" },
    { id: "scene", name: "シーン" },
    { id: "mood", name: "気分" },
  ];

  // データの取得
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const result = await getUniqueThemes(); // 新しい関数を使用
        
        // テーマ情報にアイコンを追加
        const formattedThemes: Theme[] = (result.contents || []).map(theme => {
          return {
            ...theme,
            icon: getThemeIcon(theme.id)
          };
        });
        
        setThemes(formattedThemes);
        setDisplayThemes(formattedThemes);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch themes:", error);
        setIsLoading(false);
        
        // エラー時のフォールバック: デフォルトテーマを表示
        const fallbackThemes = [
          { id: "popular", name: "人気ランキング", description: "人気の商品をピックアップ", productCount: 10 },
          { id: "new-trend", name: "新着トレンド", description: "最新の商品", productCount: 8 },
          { id: "best-value", name: "コスパ最強", description: "お買い得な商品", productCount: 12 },
          { id: "gift", name: "ギフトにおすすめ", description: "プレゼントに最適な商品", productCount: 9 },
          { id: "office", name: "オフィス向け", description: "職場でも使いやすい商品", productCount: 7 },
          { id: "date", name: "デート向け", description: "特別な日の商品", productCount: 6 },
        ].map(theme => ({
          ...theme,
          icon: getThemeIcon(theme.id)
        }));
        
        setThemes(fallbackThemes);
        setDisplayThemes(fallbackThemes);
      }
    };

    fetchThemes();
  }, []);

  // 検索とフィルタリング
  useEffect(() => {
    let filtered = [...themes];
    
    // カテゴリーでフィルタリング
    if (selectedCategory !== "all") {
      filtered = filtered.filter(theme => {
        const id = theme.id.toLowerCase();
        const name = theme.name.toLowerCase();
        
        if (selectedCategory === "popular") {
          return id === "popular" || (theme.productCount && theme.productCount >= 10);
        } else if (selectedCategory === "seasonal") {
          return id === "seasonal" || id.includes("season") || 
                 name.includes("季節") || name.includes("春") || 
                 name.includes("夏") || name.includes("秋") || 
                 name.includes("冬");
        } else if (selectedCategory === "scene") {
          return id === "office" || id === "date" || id.includes("scene") ||
                 name.includes("シーン") || name.includes("オフィス") || 
                 name.includes("デート") || name.includes("パーティー");
        } else if (selectedCategory === "mood") {
          return name.includes("気分") || name.includes("爽やか") || 
                 name.includes("優しい") || name.includes("オシャレ");
        }
        return true;
      });
    }
    
    // 検索用語でフィルタリング
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        theme => 
          theme.name.toLowerCase().includes(term) || 
          (theme.description && theme.description.toLowerCase().includes(term))
      );
    }
    
    setDisplayThemes(filtered);
  }, [searchTerm, selectedCategory, themes]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ヘッダー部分 */}
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">テーマ別セレクション</h1>
      </div>

      {/* 検索部分 */}
      <div className="mb-6">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="テーマを検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-custom-peach"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>

        {/* カテゴリフィルター */}
        <div className="flex overflow-x-auto space-x-2 pb-2">
          {themeCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                selectedCategory === category.id
                  ? "bg-custom-peach text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* テーマ説明 */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-2">テーマ別コレクション</h2>
        <p className="text-sm text-gray-600">
          シーン別や香り別など、多彩なテーマごとにアイテムをセレクトしています。
          お気に入りのテーマを見つけて、あなたにぴったりの香りを探しましょう。
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-custom-peach rounded-full border-t-transparent"></div>
        </div>
      ) : displayThemes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayThemes.map((theme) => (
            <Link
              key={theme.id}
              href={`/themes/${theme.id}`}
              className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="h-40 bg-gray-200 relative">
                {theme.imageUrl ? (
                  <Image
                    src={theme.imageUrl}
                    alt={theme.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-custom-peach to-pink-300">
                    <span className="text-white text-xl font-bold">{theme.name.substring(0, 2)}</span>
                  </div>
                )}
                {/* 商品数バッジ */}
                {theme.productCount !== undefined && (
                  <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 text-custom-peach text-xs font-bold px-2 py-1 rounded-full">
                    {theme.productCount}個のアイテム
                  </div>
                )}
              </div>
              <div className="p-4 flex-grow">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 rounded-full bg-custom-peach bg-opacity-20 flex items-center justify-center mr-2">
                    {theme.icon}
                  </div>
                  <h3 className="text-md font-bold">{theme.name}</h3>
                </div>
                {theme.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{theme.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">検索条件に一致するテーマがありません</p>
        </div>
      )}
    </div>
  );
};

export default ThemesPage;