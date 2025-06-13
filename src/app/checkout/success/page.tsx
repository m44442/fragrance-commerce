"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, CreditCard, ArrowRight } from "lucide-react";

interface OrderDetails {
  id: string;
  total: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  estimatedDelivery: string;
  paymentMethod: string;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (sessionId || orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [sessionId, orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/checkout/success?session_id=${sessionId}&order_id=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data.order);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          {/* 成功アイコン */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          {/* メインメッセージ */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ご注文ありがとうございます！
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            ご注文が正常に完了いたしました。確認メールをお送りしておりますのでご確認ください。
          </p>

          {/* 注文詳細 */}
          {orderDetails && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">注文詳細</h3>
                <span className="text-sm text-gray-500">注文ID: {orderDetails.id}</span>
              </div>

              <div className="space-y-3 mb-6">
                {orderDetails.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">数量: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ¥{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>合計金額</span>
                  <span>¥{orderDetails.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* 次のステップ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600 mt-1" />
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 mb-1">お支払い完了</h4>
                <p className="text-sm text-gray-600">
                  {orderDetails?.paymentMethod || "クレジットカード"}でのお支払いが完了しました
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <Package className="h-6 w-6 text-green-600 mt-1" />
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 mb-1">配送準備中</h4>
                <p className="text-sm text-gray-600">
                  {orderDetails?.estimatedDelivery || "3-5営業日"}でお届け予定です
                </p>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/profile/orders"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              注文履歴を確認
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              ショッピングを続ける
            </Link>
          </div>
        </div>

        {/* 追加情報 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">お困りの際は</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">配送について</h4>
              <p className="text-sm text-gray-600 mb-2">
                ・通常3-5営業日でお届けします<br />
                ・配送状況はメールでお知らせします<br />
                ・送料は全国一律500円です
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">お問い合わせ</h4>
              <p className="text-sm text-gray-600 mb-2">
                ・サポート: support@fragrance.com<br />
                ・電話: 0120-xxx-xxx<br />
                ・営業時間: 平日9:00-18:00
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}