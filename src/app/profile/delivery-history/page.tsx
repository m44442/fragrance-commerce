"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DeliveryItem {
  id: string;
  productName: string;
  status: string;
  shippingDate: string | null;
  deliveredDate: string | null;
  customSelected: boolean;
  createdAt: string;
}

const SubscriptionHistoryPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 配送履歴を取得
  useEffect(() => {
    const fetchDeliveryHistory = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/users/${session.user.id}/subscription/deliveries`);
        if (!response.ok) {
          throw new Error("配送履歴の取得に失敗しました");
        }

        const data = await response.json();
        setDeliveries(data);
      } catch (err) {
        console.error("Error fetching delivery history:", err);
        setError("配送履歴の取得中にエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchDeliveryHistory();
    } else if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/subscription/history");
    }
  }, [session, status, router]);

  // 配送ステータスを日本語で表示
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '準備中';
      case 'PROCESSING':
        return '処理中';
      case 'SHIPPED':
        return '発送済み';
      case 'DELIVERED':
        return 'お届け済み';
      case 'FAILED':
        return '配送失敗';
      default:
        return '不明';
    }
  };

  // 日付を表示用にフォーマット
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未定';
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">配送履歴</h1>
        <Link
          href="/subscription/setting"
          className="text-purple-600 hover:text-purple-800"
        >
          設定に戻る
        </Link>
      </div>
      
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {deliveries.length === 0 ? (
        <div className="bg-white border rounded-lg p-6 text-center">
          <p>配送履歴がありません。</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  発送日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  到着日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  選択タイプ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {delivery.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      delivery.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      delivery.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                      delivery.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                      delivery.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getStatusText(delivery.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(delivery.shippingDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(delivery.deliveredDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {delivery.customSelected ? 'お客様選択' : 'おまかせ'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubscriptionHistoryPage;