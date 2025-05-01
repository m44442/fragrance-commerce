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
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  if (purchases.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">購入履歴</h1>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">購入履歴がありません</p>
          <Link
            href="/"
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            香水を探す
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">購入履歴</h1>
      
      <div className="space-y-6">
        {purchases.map((purchase) => (
          <div
            key={purchase.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">
                  購入日: {format(new Date(purchase.createdAt), "yyyy年MM月dd日", { locale: ja })}
                </p>
                <p className="text-xs text-gray-400">注文番号: {purchase.id}</p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center">
              <div className="h-24 w-24 bg-gray-100 rounded relative overflow-hidden mr-4">
                <Image
                  src={purchase.fragrance.thumbnail?.url || "/images/default-product.jpg"}
                  alt={purchase.fragrance.title}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
                <div>
                  <h3 className="font-medium">{purchase.fragrance.title}</h3>
                  <p className="text-sm text-gray-500">{purchase.fragrance.brand}</p>
                  <p className="text-sm font-semibold mt-1">
                    ¥{purchase.fragrance.price?.toLocaleString()}
                  </p>
                  <Link
                    href={`/products/${purchase.fragranceId}`}
                    className="text-purple-600 text-sm hover:underline inline-block mt-2"
                  >
                    商品を見る
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;