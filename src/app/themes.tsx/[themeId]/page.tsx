// src/app/themes/[themeId]/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft, Heart, ShoppingBag, Share2 } from "lucide-react";
import { getAllProducts, client, getThemeProducts } from "@/lib/microcms/client";
import { productType } from "@/types/types";

// テーマデータの型定義
interface ThemeData {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  subtitle?: string;
}

// テーマデータのモック
const themeData: Record<string, ThemeData> = {
  "1": {
    id: "1",
    name: "秒買い香水ランキング",
    description: "迷ったらこれ！即決できる人気香水をご紹介します。香りの魅力、人気の秘密、実際の使用感など、プロがセレクトした自信を持っておすすめできる香水ばかりです。",
    imageUrl: "/images/theme1.jpg",
    subtitle: "迷ったらこれを買え！"
  },
  "2": {
    id: "2",
    name: "日常使い香水ランキング",
    description: "毎日使いたい定番の香りをセレクトしました。控えめながらも心地よく、オフィスや学校など様々なシーンで使いやすい香水を集めています。",
    imageUrl: "/images/theme2.jpg",
    subtitle: "毎日の生活に溶け込む上質な香り"
  },
  "3": {
    id: "3",
    name: "爽やかな印象の優しい香り",
    description: "清潔感あふれる優しい香りをセレクトしました。自然で爽やかな香りは、初対面の人にも好印象を与えます。デイリーユースはもちろん、ビジネスシーンにもぴったりです。",
    imageUrl: "/images/theme3.jpg",
    subtitle: "清潔感をまとうフレッシュな香り"
  },
  "4": {
    id: "4",
    name: "気づいたら真似された香水",
    description: "周りから「何の香りですか？」と聞かれることの多い、印象的で魅力的な香水をご紹介します。独自性と普遍的な魅力を兼ね備えた香りばかりです。",
    imageUrl: "/images/theme4.jpg",
    subtitle: "周りの注目を集める香り"
  },
  "5": {
    id: "5",
    name: "紅茶系香水",
    description: "紅茶の香りが楽しめる贅沢な香水を集めました。アールグレイ、ダージリン、チャイなど様々な紅茶の香りをベースにした、温かみと落ち着きのある香りをお楽しみください。",
    imageUrl: "/images/theme5.jpg",
    subtitle: "紅茶の温かみと贅沢さをまとう"
  },
};

const ThemeDetailPage = () => {
  const params = useParams();
  const themeId = params.themeId as string;
  const [products, setProducts] = useState<productType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const theme = themeData[themeId] || {
    id: themeId,
    name: `テーマコレクション ${themeId}`,
    description: "このテーマに沿った商品をご紹介します。",
  };

  // 商品データの取得
  useEffect(() => {
    const fetchThemeProducts = async () => {
      try {
        // テーマ情報の取得
        let themeInfo = theme;
        
        try {
          const themeResult = await client.getListDetail({
            endpoint: 'theme_collections',
            contentId: themeId,
          });
          
          if (themeResult) {
            themeInfo = {
              id: themeResult.id,
              name: themeResult.name || themeResult.title,
              description: themeResult.description || '',
              imageUrl: themeResult.imageUrl || themeResult.thumbnail?.url,
              subtitle: themeResult.subtitle || ''
            };
          }
        } catch (themeError) {
          console.error("Failed to fetch theme details:", themeError);
          // エラーがあっても続行 - デフォルトのテーマ情報を使用
        }
        
        // テーマに関連する商品の取得
        let themeProducts: productType[] = [];
        
        try {
          // テーマに関連する商品のクエリパラメータを設定
          // 実際のAPIの仕様に合わせて調整が必要
          const productResult = await client.getList({
            endpoint: 'rumini',
            queries: {
              filters: `theme[equals]${themeId}`,
              limit: 20
            }
          });
          
          themeProducts = productResult.contents || [];
          
          // 関連商品が見つからない場合は、すべての商品から選択
          if (themeProducts.length === 0) {
            const allProducts = await getAllProducts();
            // 関連性がありそうな商品をフィルタリング（例：テーマの名前やキーワードを含む商品）
            themeProducts = allProducts.contents.filter(product => 
              product.description?.includes(themeInfo.name) ||
              product.title?.includes(themeInfo.name)
            );
            
            // それでも見つからない場合は、ランダムにいくつかの商品を選択
            if (themeProducts.length < 4) {
              themeProducts = allProducts.contents
                .sort(() => 0.5 - Math.random())
                .slice(0, 8);
            }
          }
        } catch (productError) {
          console.error("Failed to fetch theme products:", productError);
          // エラーがあった場合はすべての商品からランダムに選択
          const allProducts = await getAllProducts();
          themeProducts = allProducts.contents
            .sort(() => 0.5 - Math.random())
            .slice(0, 8);
        }
        
        setProducts(themeProducts || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch theme products:", error);
        setIsLoading(false);
      }
    };

    fetchThemeProducts();
  }, [themeId, theme]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ヘッダー部分 */}
      <div className="flex items-center mb-6">
        <Link href="/themes" className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">{theme.name}</h1>
      </div>

      {/* テーマバナー */}
      <div className="relative mb-6 rounded-lg overflow-hidden h-60">
        {theme.imageUrl ? (
          <Image
            src={theme.imageUrl}
            alt={theme.name}
            layout="fill"
            objectFit="cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-custom-peach to-pink-300">
            <h2 className="text-white text-3xl font-bold">{theme.name}</h2>
          </div>
        )}
        
        {/* オーバーレイテキスト */}
        <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-end p-6">
          <h2 className="text-white text-3xl font-bold mb-2">{theme.name}</h2>
          {theme.subtitle && (
            <p className="text-white text-lg">{theme.subtitle}</p>
          )}
        </div>
      </div>

      {/* テーマ説明 */}
      <div className="mb-8 bg-gray-50 p-6 rounded-lg">
        <p className="text-gray-700">{theme.description}</p>
        <div className="flex space-x-4 mt-4">
          <button className="flex items-center text-gray-500">
            <Heart className="w-5 h-5 mr-1" />
            <span>お気に入り</span>
          </button>
          <button className="flex items-center text-gray-500">
            <Share2 className="w-5 h-5 mr-1" />
            <span>シェア</span>
          </button>
        </div>
      </div>

      {/* 商品一覧 */}
      <h3 className="text-xl font-bold mb-4">テーマの商品</h3>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-custom-peach rounded-full border-t-transparent"></div>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg overflow-hidden shadow-md">
              <Link href={`/products/${product.id}`}>
                <div className="relative h-48">
                  {product.thumbnail?.url ? (
                    <Image 
                      src={product.thumbnail.url} 
                      alt={product.title} 
                      layout="fill" 
                      objectFit="cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                      No Image
                    </div>
                  )}
                  {product.isNew && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      NEW
                    </div>
                  )}
                </div>
              </Link>
              
              <div className="p-4">
                <p className="text-sm text-gray-500">{product.brand}</p>
                <Link href={`/products/${product.id}`}>
                  <h4 className="text-md font-medium mb-1 hover:text-custom-peach">{product.title}</h4>
                </Link>
                <p className="text-sm font-bold mb-2">¥{product.price?.toLocaleString()}</p>
                
                <div className="flex space-x-2">
                  <button className="flex-1 flex items-center justify-center bg-custom-peach text-white py-2 rounded hover:bg-custom-peach-dark">
                    <ShoppingBag className="w-4 h-4 mr-1" />
                    <span>カートに追加</span>
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100">
                    <Heart className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">このテーマに関連する商品が見つかりませんでした</p>
        </div>
      )}
      
      {/* おすすめテーマ */}
      <div className="mt-12">
        <h3 className="text-xl font-bold mb-4">関連テーマ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(themeData)
            .filter(item => item.id !== themeId)
            .slice(0, 3)
            .map(relatedTheme => (
              <Link
                key={relatedTheme.id}
                href={`/themes/${relatedTheme.id}`}
                className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="h-32 bg-gray-200 relative">
                  {relatedTheme.imageUrl ? (
                    <Image
                      src={relatedTheme.imageUrl}
                      alt={relatedTheme.name}
                      layout="fill"
                      objectFit="cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-custom-peach to-pink-300">
                      <span className="text-white text-xl font-bold">{relatedTheme.name.substring(0, 2)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-end">
                    <h4 className="text-white font-bold p-3">{relatedTheme.name}</h4>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeDetailPage;