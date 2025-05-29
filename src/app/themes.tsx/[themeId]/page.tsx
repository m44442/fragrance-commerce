// src/app/themes/[themeId]/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft, Heart, ShoppingBag, Share2 } from "lucide-react";
import { getAllProducts, client } from "@/lib/microcms/client";
import { productType } from "@/types/types";

// テーマデータの型定義
interface ThemeData {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  subtitle?: string;
}

const ThemeDetailPage = () => {
  const params = useParams();
  const themeId = params?.themeId as string;
  const [products, setProducts] = useState<productType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [themeInfo, setThemeInfo] = useState<ThemeData>({
    id: themeId,
    name: `テーマ: ${themeId}`,
    description: "このテーマに沿った商品をご紹介します。",
  });

  // 商品データとテーマ情報の取得
  useEffect(() => {
    const fetchThemeData = async () => {
      try {
        // 1. まずテーマの情報をMicroCMSから取得
        try {
          // テーマ情報をMicroCMSから取得するエンドポイントがあれば使用
          // 今回は仮に全商品から最初にこのテーマを含むものから取得
          const themeQuery = await client.getList({
            endpoint: "rumini",
            queries: {
              filters: `themes[contains]${themeId}`,
              limit: 1
            }
          });
          
          if (themeQuery.contents.length > 0) {
            const firstProduct = themeQuery.contents[0];
            // テーマの名前とスタイルを決定
            // 通常はMicroCMSに別途テーマのマスターデータがあるはず
            const themeName = (() => {
              if (themeId === 'popular') return '人気ランキング';
              if (themeId === 'new-trend') return '新着トレンド';
              if (themeId === 'best-value') return 'コスパ最強';
              if (themeId === 'gift') return 'ギフトにおすすめ';
              if (themeId === 'office') return 'オフィス向け';
              if (themeId === 'date') return 'デート向け';
              if (themeId === 'seasonal') return '季節のおすすめ';
              // テーマIDから自動生成
              const formattedName = themeId
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              return formattedName;
            })();
            
            setThemeInfo({
              id: themeId,
              name: themeName,
              description: firstProduct.themeDescription || `${themeName}の商品をご紹介します。`,
              // 画像はテーマ専用画像があればそれを、なければ最初の商品の画像を使用
              imageUrl: firstProduct.thumbnail?.url,
              subtitle: `${themeName}でセレクトした商品コレクション`
            });
          }
        } catch (themeError) {
          console.error("Failed to fetch theme info:", themeError);
          // エラー時はデフォルト値をそのまま使用
        }
        
        // 2. テーマに関連する商品を取得
        const result = await client.getList({
          endpoint: 'rumini',
          queries: {
            filters: `themes[contains]${themeId}`,
            limit: 20
          }
        });
        
        // 商品情報をセット
        setProducts(result.contents || []);
        
        // 商品が見つからない場合の対応
        if (result.contents.length === 0) {
          try {
            const allProducts = await getAllProducts();
            // 関連性のありそうな商品をフィルタリング
            const filteredProducts = allProducts.contents.filter(product => {
              // テーマ名と商品説明などからマッチするものを探す
              const themeLower = themeInfo.name.toLowerCase();
              const descLower = (product.description || '').toLowerCase();
              const titleLower = product.title.toLowerCase();
              
              return descLower.includes(themeLower) || 
                    titleLower.includes(themeLower) ||
                    (product.keywords && product.keywords.toLowerCase().includes(themeLower));
            });
            
            // 関連商品が見つかれば表示、なければランダムに表示
            if (filteredProducts.length > 0) {
              setProducts(filteredProducts.slice(0, 8));
            } else {
              const randomProducts = allProducts.contents
                .sort(() => 0.5 - Math.random())
                .slice(0, 8);
              setProducts(randomProducts);
            }
          } catch (fallbackError) {
            console.error("Failed to fetch fallback products:", fallbackError);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch theme data:", error);
        setIsLoading(false);
      }
    };

    fetchThemeData();
  }, [themeId]);

  // 関連テーマの取得（最大3つ）
  const [relatedThemes, setRelatedThemes] = useState<ThemeData[]>([]);
  
  useEffect(() => {
    const fetchRelatedThemes = async () => {
      try {
        // テーマ専用のAPIがあればそれを使用するのがベスト
        // ここでは商品からユニークなテーマを抽出する方法を示す
        const allThemesQuery = await client.getList({
          endpoint: "rumini",
          queries: {
            fields: "themes",
            limit: 50
          }
        });
        
        // すべての商品からユニークなテーマIDを抽出
        const uniqueThemes = new Set<string>();
        allThemesQuery.contents.forEach(product => {
          if (product.themes && Array.isArray(product.themes)) {
            product.themes.forEach((theme : any) => {
              if (theme !== themeId) {
                uniqueThemes.add(theme);
              }
            });
          }
        });
        
        // ランダムに3つのテーマを選ぶ
        const selectedThemes = Array.from(uniqueThemes)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        
        // 関連テーマのサンプルデータを作成
        // 実際の実装では、テーマの詳細情報をMicroCMSから取得するべき
        const relatedThemeData = selectedThemes.map(id => {
          // テーマIDから表示名を生成
          const name = id
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
          return {
            id,
            name,
            description: `${name}テーマの商品コレクション`,
          };
        });
        
        setRelatedThemes(relatedThemeData);
      } catch (error) {
        console.error("Failed to fetch related themes:", error);
      }
    };
    
    if (!isLoading) {
      fetchRelatedThemes();
    }
  }, [themeId, isLoading]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ヘッダー部分 */}
      <div className="flex items-center mb-6">
        <Link href="/themes" className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">{themeInfo.name}</h1>
      </div>

      {/* テーマバナー */}
      <div className="relative mb-6 rounded-lg overflow-hidden h-60">
        {themeInfo.imageUrl ? (
          <Image
            src={themeInfo.imageUrl}
            alt={themeInfo.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-custom-peach to-pink-300">
            <h2 className="text-white text-3xl font-bold">{themeInfo.name}</h2>
          </div>
        )}
        
        {/* オーバーレイテキスト */}
        <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-end p-6">
          <h2 className="text-white text-3xl font-bold mb-2">{themeInfo.name}</h2>
          {themeInfo.subtitle && (
            <p className="text-white text-lg">{themeInfo.subtitle}</p>
          )}
        </div>
      </div>

      {/* テーマ説明 */}
      <div className="mb-8 bg-gray-50 p-6 rounded-lg">
        <p className="text-gray-700">{themeInfo.description}</p>
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
                  <button aria-label="いいね" className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100">
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
      {relatedThemes.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-4">関連テーマ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedThemes.map(relatedTheme => (
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
      )}
    </div>
  );
};

export default ThemeDetailPage;