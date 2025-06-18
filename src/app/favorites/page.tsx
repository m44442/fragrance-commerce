"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";

interface FavoriteProduct {
  id: string;
  title: string;
  brand: string;
  price: number;
  thumbnail?: {
    url: string;
  };
  category: string[];
}

export default function FavoritesPage() {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchFavorites = async () => {
    try {
      console.log("=== Fetching favorites ===");
      console.log("User ID:", session?.user?.id);
      
      const response = await fetch(`/api/users/${session?.user?.id}/favorites`);
      console.log("Favorites API response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Favorites data:", data);
        setFavorites(data.favorites || []);
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch favorites:", errorData);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (productId: string) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/like/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFavorites(favorites.filter((item) => item.id !== productId));
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  const addToCart = async (productId: string) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: 1 }),
      });

      if (response.ok) {
        // カート追加成功の通知
        alert("カートに追加しました");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            お気に入りを見るにはログインが必要です
          </h2>
          <p className="text-gray-600 mb-6">
            ログインして、お気に入りの香水をチェックしましょう
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            ログイン
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">お気に入り</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                <div className="bg-gray-300 h-4 rounded mb-2"></div>
                <div className="bg-gray-300 h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          お気に入り ({favorites.length}件)
        </h1>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              お気に入りがまだありません
            </h2>
            <p className="text-gray-600 mb-6">
              気になる香水をお気に入りに追加して、いつでも確認できるようにしましょう
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              香水を探す
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden group">
                <div className="relative">
                  <Link href={`/products/${product.id}`}>
                    <div className="aspect-square bg-gray-200 relative overflow-hidden">
                      {product.thumbnail?.url ? (
                        <Image
                          src={product.thumbnail.url}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={() => removeFavorite(product.id)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                    title="お気に入りから削除"
                  >
                    <Heart className="h-4 w-4 text-red-500 fill-current" />
                  </button>
                </div>

                <div className="p-4">
                  <Link href={`/products/${product.id}`}>
                    <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                    <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        {product.category.join(", ")}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        ¥{product.price?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <button
                      onClick={() => addToCart(product.id)}
                      className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      title="カートに追加"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}