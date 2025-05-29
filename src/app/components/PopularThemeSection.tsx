"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

// テーマの型定義
interface Theme {
  id: string;
  title: string;
  imageUrl: string;
}

const PopularThemeSection = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  // データ取得用の関数
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        // 実際の実装ではAPIからデータを取得
        // const response = await fetch('/api/themes/popular');
        // const data = await response.json();
        
        // デモ用のモックデータ
        const mockData: Theme[] = [
          { id: "1", title: "秒買い香水ランキング", imageUrl: "/images/theme1.jpg" },
          { id: "2", title: "日常使い香水ランキング", imageUrl: "/images/theme2.jpg" },
          { id: "3", title: "爽やかな印象の優しい香り", imageUrl: "/images/theme3.jpg" },
          { id: "4", title: "気づいたら真似された香水", imageUrl: "/images/theme4.jpg" },
          { id: "5", title: "紅茶系香水", imageUrl: "/images/theme5.jpg" },
          { id: "6", title: "ペアーの香り", imageUrl: "/images/theme6.jpg" },
          { id: "7", title: "シャンプーっぽい香り", imageUrl: "/images/theme7.jpg" },
          { id: "8", title: "これは手放せないオシャレな香水", imageUrl: "/images/theme8.jpg" }
        ];
        
        setThemes(mockData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch themes:", error);
        setLoading(false);
      }
    };

    fetchThemes();
  }, []);

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">人気のテーマ</h2>
        <Link href="/themes" className="text-gray-500 text-sm">
          もっと見る &gt;
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        シーン別や香り別など、多彩なテーマごとにアイテムをセレクトしています。
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <Link key={theme.id} href={`/themes/${theme.id}`} className="block">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="h-32 bg-gray-200 relative">
                  {theme.imageUrl ? (
                    <img 
                      src={theme.imageUrl} 
                      alt={theme.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium">{theme.title}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PopularThemeSection;