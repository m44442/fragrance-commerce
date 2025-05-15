// src/app/themes/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Search, Heart, Calendar, Coffee, Wine, Briefcase, Music, Sun, Moon } from "lucide-react";
import { getThemeProducts } from "@/lib/microcms/client";

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
      "season": <Calendar className="w-4 h-4" />,
      "coffee": <Coffee className="w-4 h-4" />,
      "wine": <Wine className="w-4 h-4" />,
      "office": <Briefcase className="w-4 h-4" />,
      "music": <Music className="w-4 h-4" />,
      "day": <Sun className="w-4 h-4" />,
      "night": <Moon className="w-4 h-4" />,
    };
    return icons[themeId] || <Heart className="w-4 h-4" />;
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
        const result = await getThemeProducts();
        
        // MicroCMSからのデータを整形してTheme配列に変換
        const formattedThemes: Theme[] = (result.contents || []).map(theme => {
          // アイコンをテーマIDに基づいて割り当て
          let icon = <Heart />;
          if (theme.id.includes('season')) icon = <Calendar />;
          else if (theme.id.includes('fresh') || theme.id.includes('summer')) icon = <Sun />;
          else if (theme.id.includes('music')) icon = <Music />;
          else if (theme.id.includes('tea') || theme.id.includes('coffee')) icon = <Coffee />;
          else if (theme.id.includes('wine')) icon = <Wine />;
          else if (theme.id.includes('office')) icon = <Briefcase />;
          else if (theme.id.includes('night')) icon = <Moon />;
          
          return {
            id: theme.id,
            name: theme.name || theme.title,
            description: theme.description || '',
            imageUrl: theme.imageUrl || theme.thumbnail?.url,
            productCount: theme.productCount || 0,
            icon: icon
          };
        });
        
        setThemes(formattedThemes);
        setDisplayThemes(formattedThemes);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch themes:", error);
        setIsLoading(false);
      }
    };

    fetchThemes();
  }, []);

  // 検索とフィルタリング
  useEffect(() => {
    let filtered = [...themes];
    
    // カテゴリーでフィルタリング
    if (selectedCategory !== "all") {
      // 実際の実装では、テーマにカテゴリータグがあると仮定
      filtered = filtered.filter(theme => {
        if (selectedCategory === "popular") {
          // 人気のテーマ（例：productCountが10以上）
          return theme.productCount && theme.productCount >= 10;
        } else if (selectedCategory === "seasonal") {
          // 季節のテーマ（名前に「夏」「冬」などが含まれる）
          return theme.name.includes("夏") || theme.name.includes("冬") || 
                 theme.name.includes("春") || theme.name.includes("秋") ||
                 theme.name.includes("season");
        } else if (selectedCategory === "scene") {
          // シーン別テーマ（名前に「オフィス」「デート」などが含まれる）
          return theme.name.includes("オフィス") || theme.name.includes("デート") || 
                 theme.name.includes("夜") || theme.name.includes("お出かけ");
        } else if (selectedCategory === "mood") {
          // 気分別テーマ（名前に「爽やか」「落ち着く」などが含まれる）
          return theme.name.includes("爽やか") || theme.name.includes("優しい") || 
                 theme.name.includes("オシャレ");
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
                    layout="fill"
                    objectFit="cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-custom-peach to-pink-300">
                    <span className="text-white text-xl font-bold">{theme.name.substring(0, 2)}</span>
                  </div>
                )}
                {/* 商品数バッジ */}
                <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 text-custom-peach text-xs font-bold px-2 py-1 rounded-full">
                  {theme.productCount}個のアイテム
                </div>
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