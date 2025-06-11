// src/app/profile/orders/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

// 購入履歴のAPI取得用関数
const fetchPurchaseHistory = async (userId: string) => {
  try {
    const response = await fetch(`/api/users/${userId}/purchases`);
    if (!response.ok) throw new Error("Failed to fetch purchase history");
    return await response.json();
  } catch (error) {
    console.error("Error fetching purchase history:", error);
    return { purchases: [] };
  }
};

const OrdersPage = () => {
  const { data: session } = useSession();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadPurchases = async () => {
      if (!session?.user?.id) return;
      
      try {
        const data = await fetchPurchaseHistory(session.user.id);
        setPurchases(data.purchases || []);
      } catch (error) {
        console.error("Error loading purchases:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPurchases();
  }, [session]);
  
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            ログインが必要です
          </h2>
          <p className="text-gray-600 mb-6">
            購入履歴を確認するにはログインしてください
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">購入履歴</h1>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-300 h-16 w-16 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="bg-gray-300 h-4 rounded mb-2 w-3/4"></div>
                    <div className="bg-gray-300 h-3 rounded w-1/2"></div>
                  </div>
                  <div className="bg-gray-300 h-6 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (purchases.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">購入履歴</h1>
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-6">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">購入履歴がありません</h3>
            <p className="text-gray-500 mb-6">
              まだ商品をご購入いただいていません。お気に入りの香水を見つけて購入してみましょう。
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              香水を探す
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">購入履歴</h1>
        
        <div className="space-y-6">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      購入日: {format(new Date(purchase.createdAt), "yyyy年MM月dd日", { locale: ja })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">注文番号: {purchase.id.slice(0, 8)}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    購入完了
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 bg-gray-100 rounded-lg relative overflow-hidden flex-shrink-0">
                    <Image
                      src={purchase.fragrance.thumbnail?.url || "/default_icon.png"}
                      alt={purchase.fragrance.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {purchase.fragrance.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{purchase.fragrance.brand}</p>
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      ¥{purchase.fragrance.price?.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Link
                      href={`/products/${purchase.fragranceId}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      商品を見る
                    </Link>
                    <Link
                      href={`/products/${purchase.fragranceId}#reviews`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                      レビューを書く
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;